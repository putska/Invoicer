"use client";
import { useCallback, useEffect, useState, useContext } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { generatePDF } from "../../../components/pdfUtils";
import { useFullNameFromDB } from "../../../components/useFullNameFromDB";

// ---------------- Schema & Types ----------------

const poSchema = z.object({
  vendorId: z.number().min(1, "Please select a vendor"),
  poNumber: z.string().optional(),
  jobId: z.number().min(1, "Please select a job"),
  projectManager: z.string().min(1, "Project manager name is required"),
  poDate: z.string().min(1, "PO Date is required"),
  dueDate: z.string().optional(),
  amount: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(parseFloat(val)),
      "Amount must be a valid number"
    )
    .refine(
      (val) => !val || parseFloat(val) >= 0,
      "Amount must be a non-negative number"
    ),
  shipTo: z.string().optional(),
  shipToAddress: z.string().optional(),
  shipToCity: z.string().optional(),
  shipToState: z.string().optional(),
  shipToZip: z.string().optional(),
  costCode: z.string().optional(),
  shortDescription: z
    .string()
    .min(1, "Short description is required")
    .max(100, "Short description must be 100 characters or less"),
  longDescription: z.string().optional(),
  notes: z.string().optional(),
  received: z.string().optional(),
  backorder: z.string().optional(),
  generatePDF: z.boolean().default(false),
});

type PurchaseOrder = z.infer<typeof poSchema>;

type Vendor = {
  id: number;
  vendorName: string;
};

type Project = {
  id: number;
  name: string;
  status: string;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

type VendorsApiResponse = {
  message: string;
  vendors: Vendor[];
};

type ProjectsApiResponse = {
  message: string;
  projects: Project[];
};

// ---------------- Reusable Form Field Component ----------------

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const FormField = ({ label, error, children }: FormFieldProps) => (
  <div className="mb-4">
    <label
      className={`block mb-1 ${
        error ? "text-red-700 font-medium" : "text-gray-700"
      }`}
    >
      {label}
    </label>
    {children}
    {error && (
      <div className="mt-1 flex items-center">
        <svg
          className="h-4 w-4 text-red-500 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-red-600 text-sm font-medium">{error}</span>
      </div>
    )}
  </div>
);

// ---------------- Main Component ----------------

export default function PurchaseOrderFormPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, dirtyFields },
    setValue,
  } = useForm<PurchaseOrder>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      poDate: new Date().toISOString().split("T")[0],
      projectManager: fullName || "",
      amount: "0",
      generatePDF: false,
    },
  });

  // ---------------- Debounced Auto-Save ----------------

  // Watch form values so we can auto-save drafts for existing records
  const watchedValues = useWatch({ control });

  const saveDraft = useCallback(
    async (data: PurchaseOrder) => {
      try {
        const response = await fetch(`/api/purchasing/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!response.ok)
          throw new Error(`Auto-save HTTP error: ${response.status}`);
        console.log("Draft saved successfully");
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    },
    [id]
  );

  useEffect(() => {
    if (id && id !== "new" && Object.keys(dirtyFields).length > 0) {
      const handler = setTimeout(() => {
        handleSubmit(async (data) => {
          await saveDraft(data);
        })();
      }, 2000);
      return () => clearTimeout(handler);
    }
  }, [watchedValues, dirtyFields, id, handleSubmit, saveDraft]);

  // Update projectManager when fullName changes
  useEffect(() => {
    if (fullName) {
      setValue("projectManager", fullName);
    }
  }, [fullName, setValue]);

  // ---------------- API Loaders ----------------

  const loadPurchaseOrder = useCallback(
    async (poId: string) => {
      try {
        const response = await fetch(`/api/purchasing/${poId}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        // Log the entire response to see the structure
        const result = await response.json();
        console.log("Purchase Order API response:", result);

        // Adjust this check to match the actual structure:
        if (!result.purchaseOrder) {
          throw new Error(result.error || "Invalid response structure");
        }

        const po = result.purchaseOrder;
        // Format dates and reset form values
        reset({
          ...po,
          poDate: format(new Date(po.poDate), "yyyy-MM-dd"),
          dueDate: po.dueDate
            ? format(new Date(po.dueDate), "yyyy-MM-dd")
            : undefined,
        });
        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setStatus("error");
      }
    },
    [reset]
  );

  const loadVendors = useCallback(async () => {
    try {
      const response = await fetch("/api/vendors");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      // Parse the response using the expected structure
      const result: VendorsApiResponse = await response.json();
      console.log("Vendors API response:", result);
      if (!result.vendors) throw new Error("Failed to load vendors");
      setVendors(result.vendors);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result: { message: string; projects: Project[] } =
        await response.json();
      if (!result.projects) throw new Error("Failed to load projects");

      // If we're editing (id exists and isn't "new"), show all projects.
      // Otherwise, for a new PO, show only active projects.
      const filteredProjects =
        id && id !== "new"
          ? result.projects
          : result.projects.filter((project) => project.status === "active");

      // Sort projects alphabetically by name
      const sortedProjects = filteredProjects.sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setProjects(sortedProjects);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  }, [id]);

  useEffect(() => {
    async function fetchData() {
      try {
        // Wait for dropdown data to load
        await Promise.all([loadVendors(), loadProjects()]);

        // Now load the purchase order if we're editing
        if (id && id !== "new") {
          await loadPurchaseOrder(id);
        } else {
          setStatus("success");
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [id, loadPurchaseOrder, loadVendors, loadProjects]);

  // ---------------- Form Submission ----------------

  // In your PurchaseOrderFormPage component, modify the onSubmit function:

  const onSubmit = async (formData: PurchaseOrder) => {
    try {
      // Clear any previous errors
      setError(null);

      const updatedData = {
        ...formData,
        poDate: formData.poDate
          ? new Date(formData.poDate).toISOString().split("T")[0]
          : null,
        costCode: formData.costCode ?? "",
        received: formData.received ?? "",
        backorder: formData.backorder ?? "",
        notes: formData.notes ?? "",
        longDescription: formData.longDescription ?? "",
      };

      // Only add dueDate if it has a real value (not empty string)
      if (formData.dueDate && formData.dueDate.trim() !== "") {
        updatedData.dueDate = new Date(formData.dueDate)
          .toISOString()
          .split("T")[0];
      }

      console.log("Saving with data:", updatedData);
      const isNewRecord = !id || id === "new";
      const method = isNewRecord ? "POST" : "PUT";
      const url = isNewRecord ? `/api/purchasing` : `/api/purchasing/${id}`;

      const vendorName =
        vendors.find((v) => v.id === formData.vendorId)?.vendorName || "";
      const projectName =
        projects.find((p) => p.id === formData.jobId)?.name || "";

      const payload = isNewRecord
        ? { ...updatedData, poNumber: undefined }
        : updatedData;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // Check if it's a validation error
        if (response.status === 400 && errorData.errors) {
          // Handle Zod validation errors from the API
          let validationMessages = [];

          // Check if errors is the Zod format
          if (typeof errorData.errors === "object") {
            // Extract field names and error messages
            for (const [fieldName, fieldErrors] of Object.entries(
              errorData.errors
            )) {
              if (Array.isArray(fieldErrors)) {
                // Handle array of errors per field
                fieldErrors.forEach((error) => {
                  validationMessages.push(`${fieldName}: ${error}`);
                });
              } else if (
                typeof fieldErrors === "object" &&
                fieldErrors !== null &&
                "_errors" in fieldErrors &&
                Array.isArray((fieldErrors as any)._errors)
              ) {
                // Handle Zod format: { fieldName: { _errors: ["message"] } }
                (fieldErrors as any)._errors.forEach((error: string) => {
                  validationMessages.push(`${fieldName}: ${error}`);
                });
              } else if (typeof fieldErrors === "string") {
                // Handle simple string errors
                validationMessages.push(`${fieldName}: ${fieldErrors}`);
              }
            }
          }

          if (validationMessages.length > 0) {
            throw new Error(validationMessages.join("; "));
          } else {
            throw new Error(
              `Validation errors: ${JSON.stringify(errorData.errors)}`
            );
          }
        } else {
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }
      }

      const result = await response.json();
      console.log("Server Response:", result);

      if (isNewRecord && formData.generatePDF) {
        generatePDF({
          ...formData,
          poNumber: result.newPurchaseOrder.poNumber,
          vendorName,
          projectName,
          amount: formData.amount || "0",
        });
      }

      // NEW: Check if we came from the main page with grid state
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get("returnUrl");
      const gridPage = searchParams.get("gridPage");
      const gridFilters = searchParams.get("gridFilters");
      const gridSort = searchParams.get("gridSort");

      if (returnUrl && returnUrl.includes("/modules/purchasing")) {
        // Construct the return URL with grid state parameters
        let finalReturnUrl = returnUrl;
        const urlParams = new URLSearchParams();

        if (gridPage) urlParams.set("page", gridPage);
        if (gridFilters) urlParams.set("filters", gridFilters);
        if (gridSort) urlParams.set("sort", gridSort);

        if (urlParams.toString()) {
          finalReturnUrl +=
            (returnUrl.includes("?") ? "&" : "?") + urlParams.toString();
        }

        router.push(finalReturnUrl);
      } else {
        // Default behavior for new records or when no return URL
        router.push("/modules/purchasing");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  // ---------------- Render ----------------

  if (status === "loading") return <div>Loading...</div>;
  if (status === "error" && error)
    return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">
        {id && id !== "new" ? "Edit Purchase Order" : "Add Purchase Order"}
      </h1>
      {/* INSERT THE ERROR DISPLAY HERE */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                There was an error saving the purchase order
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {error.includes(";") ? (
                  <ul className="list-disc list-inside space-y-1">
                    {error.split(";").map((errorMsg, index) => (
                      <li key={index}>{errorMsg.trim()}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{error}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* END OF ERROR DISPLAY */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Top Section */}
        <div className="grid grid-cols-2 gap-6">
          <FormField label="PO Date" error={errors.poDate?.message}>
            <input
              type="date"
              {...register("poDate")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
          </FormField>
          <FormField label="Vendor" error={errors.vendorId?.message}>
            <div className="flex items-center gap-2">
              <select
                {...register("vendorId", { valueAsNumber: true })}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              >
                <option value="">Select a Vendor</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.vendorName}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/modules/vendors/new?returnUrl=${encodeURIComponent(
                      window.location.href
                    )}`
                  )
                }
                className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors"
              >
                Add
              </button>
            </div>
          </FormField>
        </div>
        {/* PO Number, Job, Cost Code, Project Manager */}
        <div className="grid grid-cols-2 gap-6">
          <FormField label="PO Number" error={errors.poNumber?.message}>
            <input
              {...register("poNumber")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              disabled={id === "new"}
              readOnly={id !== "new"}
            />
          </FormField>
          <FormField label="Job" error={errors.jobId?.message}>
            <select
              {...register("jobId", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            >
              <option value="">Select a Job</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </FormField>
          <div className="col-span-2 grid grid-cols-3 gap-6">
            <FormField label="Cost Code" error={errors.costCode?.message}>
              <input
                {...register("costCode")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>
            <FormField label="Amount" error={errors.amount?.message}>
              <input
                {...register("amount")}
                className={`w-full px-4 py-2 border ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring focus:ring-indigo-100`}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const formatted = parseFloat(value).toFixed(2);
                    setValue("amount", formatted);
                  }
                }}
              />
            </FormField>
            <FormField
              label="Project Manager"
              error={errors.projectManager?.message}
            >
              <input
                {...register("projectManager")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>
          </div>
        </div>
        {/* Shipping Info */}
        <div className="grid grid-cols-2 gap-6">
          <FormField label="Due Date" error={errors.dueDate?.message}>
            <input
              type="date"
              {...register("dueDate")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
          </FormField>
          <FormField label="Ship To" error={errors.shipTo?.message}>
            <input
              {...register("shipTo")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
          </FormField>
        </div>
        {/* Received */}
        <FormField label="Received" error={errors.received?.message}>
          <textarea
            {...register("received")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
        </FormField>
        {/* Backorder */}
        <FormField label="Backorder" error={errors.backorder?.message}>
          <textarea
            {...register("backorder")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
        </FormField>
        {/* Descriptions */}

        <FormField
          label="Short Description (max 100 characters)"
          error={errors.shortDescription?.message}
        >
          <div className="relative">
            <input
              {...register("shortDescription", {
                maxLength: {
                  value: 100,
                  message: "Short description must be 100 characters or less",
                },
              })}
              className={`w-full px-4 py-2 border ${
                errors.shortDescription ? "border-red-500" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring focus:ring-indigo-100`}
              maxLength={100}
            />
            <div className="text-xs text-gray-500 mt-1">
              {watchedValues.shortDescription?.length || 0}/100 characters
            </div>
          </div>
        </FormField>
        <FormField
          label="Long Description"
          error={errors.longDescription?.message}
        >
          <textarea
            {...register("longDescription")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
        </FormField>
        <FormField label="Notes" error={errors.notes?.message}>
          <textarea
            {...register("notes")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
        </FormField>
        {/* Buttons */}
        {(!id || id === "new") && (
          <FormField label="">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="generatePDF"
                {...register("generatePDF")}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="generatePDF" className="text-gray-700">
                Generate PDF for this Purchase Order
              </label>
            </div>
          </FormField>
        )}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/modules/purchasing")}
            className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-100"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
}
