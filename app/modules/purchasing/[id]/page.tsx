"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { generatePDF } from "../../../components/pdfUtils";

// ---------------- Schema & Types ----------------

const poSchema = z.object({
  vendorId: z.number().min(1, "Vendor is required"),
  poNumber: z.string().optional(),
  jobId: z.number().min(1, "Job ID is required"),
  projectManager: z.string().min(1, "Project manager is required"),
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
  shortDescription: z.string().min(1, "Short description is required"),
  longDescription: z.string().optional(),
  notes: z.string().optional(),
  received: z.string().optional(),
  backorder: z.string().optional(),
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
    <label className="block text-gray-700 mb-1">{label}</label>
    {children}
    {error && <span className="text-red-500 text-sm">{error}</span>}
  </div>
);

// ---------------- Main Component ----------------

export default function PurchaseOrderFormPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();

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
      projectManager: user?.fullName || "",
      amount: "0",
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
      const projectsToSet =
        id && id !== "new"
          ? result.projects
          : result.projects.filter((project) => project.status === "active");

      setProjects(projectsToSet);
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

  const onSubmit = async (formData: PurchaseOrder) => {
    try {
      const updatedData = {
        ...formData,
        poDate: formData.poDate
          ? new Date(formData.poDate).toISOString().split("T")[0]
          : null,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate).toISOString().split("T")[0]
          : null,
        costCode: formData.costCode ?? "",
        received: formData.received ?? "",
        backorder: formData.backorder ?? "",
        notes: formData.notes ?? "",
        longDescription: formData.longDescription ?? "",
      };
      console.log("Saving with data:", updatedData);
      const isNewRecord = !id || id === "new";
      const method = isNewRecord ? "POST" : "PUT";
      const url = isNewRecord ? `/api/purchasing` : `/api/purchasing/${id}`;

      // Retrieve vendor and project names from state for PDF generation
      const vendorName =
        vendors.find((v) => v.id === formData.vendorId)?.vendorName || "";
      const projectName =
        projects.find((p) => p.id === formData.jobId)?.name || "";

      const payload = isNewRecord
        ? { ...updatedData, poNumber: undefined }
        : updatedData;
      console.log("Saving  data:", payload);
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      console.log("Server Response:", result);

      if (isNewRecord) {
        generatePDF({
          ...formData,
          poNumber: result.newPurchaseOrder.poNumber,
          vendorName,
          projectName,
          amount: formData.amount || "0",
        });
      }
      router.push("/modules/purchasing");
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
          label="Short Description"
          error={errors.shortDescription?.message}
        >
          <input
            {...register("shortDescription")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
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
