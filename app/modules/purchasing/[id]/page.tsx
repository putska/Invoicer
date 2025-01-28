// /app/purchasing/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { generatePDF } from "../../../components/pdfUtils";

const poSchema = z.object({
  vendorId: z.number().min(1, "Vendor is required"),
  poNumber: z.string().optional(),
  jobId: z.number().min(1, "Job ID is required"), // Updated from jobNumber
  projectManager: z.string().min(1, "Project manager is required"),
  poDate: z.string().min(1, "PO Date is required"),
  dueDate: z.string().optional(),
  amount: z
    .string()
    .optional() // Allow the field to be optional
    .refine(
      (val) => !val || !isNaN(parseFloat(val)), // Validate it's a number if not empty
      "Amount must be a valid number"
    )
    .refine(
      (val) => !val || parseFloat(val) >= 0, // Ensure non-negative
      "Amount must be a non-negative number"
    ),
  shipTo: z.string().optional(),
  shipToAddress: z.string().optional(),
  shipToCity: z.string().optional(),
  shipToState: z.string().optional(),
  shipToZip: z.string().optional(),
  costCode: z.string().min(1, "Cost code is required"),
  shortDescription: z.string().min(1, "Short description is required"),
  longDescription: z.string().optional(),
  notes: z.string().optional(),
  received: z.string().optional(), // New field
  backorder: z.string().optional(), // New field
});

type PurchaseOrder = z.infer<typeof poSchema>;

type Vendor = {
  id: number;
  vendorName: string;
};

type Project = {
  id: number;
  name: string;
  status: string; // Assuming status is a string
};

export default function PurchaseOrderFormPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string }; // Get the PO ID from the route
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]); // Vendor array
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]); // Project array
  const { user } = useUser(); // Get the logged-in user's details
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PurchaseOrder>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      poDate: new Date().toISOString().split("T")[0], // Default to today's date
      projectManager: user?.fullName || "", // Default to user's name
      amount: "0", // Default amount to 0
    },
  });

  // Fetch PO by ID or default to a new PO
  const loadPurchaseOrder = async (poId: string) => {
    try {
      const response = await fetch(`/api/purchasing/${poId}`);
      if (!response.ok) throw new Error("Error fetching purchase order");
      const data = await response.json();

      // Format the date fields to YYYY-MM-DD before setting them
      setValue(
        "poDate",
        format(new Date(data.purchaseOrder.poDate), "yyyy-MM-dd")
      );
      setValue(
        "dueDate",
        data.purchaseOrder.dueDate
          ? format(new Date(data.purchaseOrder.dueDate), "yyyy-MM-dd")
          : ""
      ); // Handle optional dueDate
      setValue("vendorId", data.purchaseOrder.vendorId);
      setValue("poNumber", data.purchaseOrder.poNumber);
      setValue("jobId", data.purchaseOrder.jobId);
      setValue("projectManager", data.purchaseOrder.projectManager);
      setValue("amount", data.purchaseOrder.amount);
      setValue("shipTo", data.purchaseOrder.shipTo);
      setValue("costCode", data.purchaseOrder.costCode);
      setValue("shortDescription", data.purchaseOrder.shortDescription);
      setValue("longDescription", data.purchaseOrder.longDescription);
      setValue("notes", data.purchaseOrder.notes);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Vendors for the drop-down
  const loadVendors = async () => {
    try {
      const response = await fetch("/api/vendors");
      const data: { vendors: Vendor[] } = await response.json(); // Type the response
      setVendors(data.vendors);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Error fetching projects");
      const data: { projects: Project[] } = await response.json(); // Type the response

      // Filter for active projects
      const activeProjects = data.projects.filter(
        (project) => project.status === "active"
      );
      setProjects(activeProjects);
    } catch (err) {
      console.error("Error fetching projects:", err);
    }
  };

  // Submit form (either update or create PO)
  const onSubmit = async (formData: PurchaseOrder) => {
    try {
      // Ensure poDate and other dates are parsed to Date objects
      const updatedData = {
        ...formData,
        poDate: formData.poDate
          ? new Date(formData.poDate).toISOString().split("T")[0]
          : null,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate).toISOString().split("T")[0]
          : null,
        costCode: formData.costCode ?? "", // Convert null to empty string
        received: formData.received ?? "", // Include received
        backorder: formData.backorder ?? "", // Include backorder
        notes: formData.notes ?? "", // Convert null to empty string
        longDescription: formData.longDescription ?? "", // Convert null to empty string
      };

      const isNewRecord = !id || id === "new"; // Determine if this is a new record
      const method = isNewRecord ? "POST" : "PUT";
      const url = isNewRecord ? `/api/purchasing` : `/api/purchasing/${id}`;

      // Safely find the vendorName and projectName
      const vendorName =
        vendors.find((v) => v.id === formData.vendorId)?.vendorName || "";

      const projectName =
        projects.find((p) => p.id === formData.jobId)?.name || "";

      // For new records, exclude poNumber (it will be generated by the server)
      const payload = isNewRecord
        ? { ...updatedData, poNumber: undefined }
        : updatedData;

      // Send the request
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Error saving purchase order");

      const result = await response.json();
      console.log("Server Response:", result);

      // If it's a new record, optionally display the PO in the browser (PDF)
      if (isNewRecord) {
        generatePDF({
          ...formData,
          poNumber: result.newPurchaseOrder.poNumber,
          vendorName,
          projectName,
          amount: formData.amount || "0", // Default to 0 if empty
        }); // Pass the newly created PO data to the PDF generator
      }

      // Redirect to the purchasing page after saving
      router.push("/modules/purchasing");
    } catch (err) {
      console.error("Error submitting form:", err);
      setError((err as Error).message);
    }
  };

  useEffect(() => {
    if (id && id !== "new") {
      loadPurchaseOrder(id); // Load PO if editing
    } else {
      setLoading(false); // Skip loading for new PO
    }
    loadVendors(); // Load vendors for dropdown
    loadProjects(); // Load projects for dropdown
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">
        {id && id !== "new" ? "Edit Purchase Order" : "Add Purchase Order"}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Top Section */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700">PO Date</label>
            <input
              type="date"
              {...register("poDate")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.poDate && (
              <span className="text-red-500">{errors.poDate.message}</span>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Vendor</label>
            <select
              {...register("vendorId", { valueAsNumber: true })} // Convert value to number
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            >
              <option value="">Select a Vendor</option>{" "}
              {/* Default empty option */}
              {vendors.map((vendor: { id: number; vendorName: string }) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.vendorName}
                </option>
              ))}
            </select>
            {errors.vendorId && (
              <span className="text-red-500">{errors.vendorId.message}</span>
            )}
          </div>
        </div>

        {/* PO Number, Job Number, Cost Code, Project Manager */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700">PO Number</label>
            <input
              {...register("poNumber")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              disabled={id === "new"} // disable for new records
              readOnly={id !== "new"} // read-only for existing records
            />
            {errors.poNumber && (
              <span className="text-red-500">{errors.poNumber.message}</span>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Job</label>
            <select
              {...register("jobId", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            >
              <option value="">Select a Job</option>{" "}
              {/* Default empty option */}
              {projects.map((project: { id: number; name: string }) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors.jobId && (
              <span className="text-red-500">{errors.jobId.message}</span>
            )}
          </div>
          <div className="col-span-2 flex space-x-4">
            <div className="flex-1">
              <label className="block text-gray-700">Cost Code</label>
              <input
                {...register("costCode")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
              {errors.costCode && (
                <span className="text-red-500">{errors.costCode.message}</span>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-gray-700">Amount</label>
              <input
                {...register("amount")}
                className={`w-full px-4 py-2 border ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring focus:ring-indigo-100`}
                onBlur={(e) => {
                  const value = e.target.value;
                  if (value) {
                    const formatted = parseFloat(value).toFixed(2); // Format as two decimal places
                    setValue("amount", formatted); // Update the form value
                  }
                }}
              />
              {errors.amount && (
                <span className="text-red-500">{errors.amount.message}</span>
              )}
            </div>
            <div className="flex-1">
              <label className="block text-gray-700">Project Manager</label>
              <input
                {...register("projectManager")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
              {errors.projectManager && (
                <span className="text-red-500">
                  {errors.projectManager.message}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Shipping Info */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700">Due Date</label>
            <input
              type="date"
              {...register("dueDate")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.dueDate && (
              <span className="text-red-500">{errors.dueDate.message}</span>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Ship To</label>
            <input
              {...register("shipTo")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.shipTo && (
              <span className="text-red-500">{errors.shipTo.message}</span>
            )}
          </div>
        </div>

        {/* Received */}
        <div>
          <label className="block text-gray-700">Received</label>
          <textarea
            {...register("received")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.received && (
            <span className="text-red-500">{errors.received.message}</span>
          )}
        </div>

        {/* Backorder */}
        <div>
          <label className="block text-gray-700">Backorder</label>
          <textarea
            {...register("backorder")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.backorder && (
            <span className="text-red-500">{errors.backorder.message}</span>
          )}
        </div>

        {/* Descriptions */}
        <div>
          <label className="block text-gray-700">Short Description</label>
          <input
            {...register("shortDescription")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.shortDescription && (
            <span className="text-red-500">
              {errors.shortDescription.message}
            </span>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Long Description</label>
          <textarea
            {...register("longDescription")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.longDescription && (
            <span className="text-red-500">
              {errors.longDescription.message}
            </span>
          )}
        </div>

        <div>
          <label className="block text-gray-700">Notes</label>
          <textarea
            {...register("notes")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.notes && (
            <span className="text-red-500">{errors.notes.message}</span>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push("/modules/purchasing")} // Redirect to purchasing page
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
