// /app/purchasing/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";

// Define PO schema using Zod
const poSchema = z.object({
  vendorId: z.number().min(1, "Vendor is required"),
  poNumber: z.string().min(1, "PO number is required"),
  jobNumber: z.string().min(1, "Job number is required"),
  projectManager: z.string().min(1, "Project manager is required"),
  poDate: z.string().min(1, "PO Date is required"), // Expect string format 'YYYY-MM-DD'
  dueDate: z.string().optional(), // String for date field
  deliveryDate: z.string().optional(), // String for date field
  shipTo: z.string().optional(),
  shipToAddress: z.string().optional(),
  shipToCity: z.string().optional(),
  shipToState: z.string().optional(),
  shipToZip: z.string().optional(),
  costCode: z.string().min(1, "Cost code is required"),
  freight: z.preprocess(
    (value) => parseFloat(value as string),
    z.number().min(0, "Freight must be a positive number")
  ),
  boxingCharges: z.preprocess(
    (value) => parseFloat(value as string),
    z.number().min(0, "Boxing charges must be a positive number")
  ),
  poAmount: z.preprocess(
    (value) => parseFloat(value as string),
    z.number().min(0, "Boxing charges must be a positive number")
  ),
  taxRate: z.preprocess(
    (value) => parseFloat(value as string),
    z.number().min(0, "Tax rate must be a positive number")
  ),
  taxable: z.boolean().default(true),
  warrantyYears: z.preprocess(
    (value) => parseFloat(value as string),
    z.number().min(0, "Boxing charges must be a positive number")
  ),
  shortDescription: z.string().min(1, "Short description is required"),
  longDescription: z
    .string()
    .nullable() // Allow null values
    .transform((value) => value ?? ""), // Transform null to an empty string
  notes: z
    .string()
    .nullable() // Allow null values
    .transform((value) => value ?? ""), // Transform null to an empty string
});

type PurchaseOrder = z.infer<typeof poSchema>;

export default function PurchaseOrderFormPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string }; // Get the PO ID from the route
  const [loading, setLoading] = useState(true);
  const [vendors, setVendors] = useState([]);
  const [error, setError] = useState<string | null>(null);
  const [taxable, setTaxable] = useState(true);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PurchaseOrder>({ resolver: zodResolver(poSchema) });

  const stateOptions = [
    { code: "AL", name: "Alabama" },
    { code: "AK", name: "Alaska" },
    { code: "AZ", name: "Arizona" },
    { code: "AR", name: "Arkansas" },
    { code: "CA", name: "California" },
    { code: "CO", name: "Colorado" },
    { code: "CT", name: "Connecticut" },
    { code: "DE", name: "Delaware" },
    { code: "FL", name: "Florida" },
    { code: "GA", name: "Georgia" },
    // ... (include all states and US territories)
    { code: "WY", name: "Wyoming" },
  ];

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
      setValue(
        "deliveryDate",
        data.purchaseOrder.deliveryDate
          ? format(new Date(data.purchaseOrder.deliveryDate), "yyyy-MM-dd")
          : ""
      ); // Handle optional deliveryDate
      setValue("vendorId", data.purchaseOrder.vendorId);
      setValue("poNumber", data.purchaseOrder.poNumber);
      setValue("jobNumber", data.purchaseOrder.jobNumber);
      setValue("projectManager", data.purchaseOrder.projectManager);
      setValue("shipTo", data.purchaseOrder.shipTo);
      setValue("shipToAddress", data.purchaseOrder.shipToAddress);
      setValue("shipToCity", data.purchaseOrder.shipToCity);
      setValue("shipToState", data.purchaseOrder.shipToState);
      setValue("shipToZip", data.purchaseOrder.shipToZip);
      setValue("costCode", data.purchaseOrder.costCode);
      setValue("freight", data.purchaseOrder.freight || 0);
      setValue("boxingCharges", data.purchaseOrder.boxingCharges || 0);
      setValue("poAmount", data.purchaseOrder.poAmount || 0);
      setValue("taxRate", data.purchaseOrder.taxRate);
      setValue("taxable", data.purchaseOrder.taxable);
      setTaxable(data.purchaseOrder.taxable);
      setValue("warrantyYears", data.purchaseOrder.warrantyYears);
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
      const data = await response.json();
      setVendors(data.vendors);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
  };

  // Submit form (either update or create PO)
  const onSubmit = async (formData: PurchaseOrder) => {
    console.log("Validated data:", formData);
    try {
      //ensure poDate and other dates are parsed to Date objects
      const updatedData = {
        ...formData,
        poDate: formData.poDate
          ? new Date(formData.poDate).toISOString().split("T")[0]
          : null,
        dueDate: formData.dueDate
          ? new Date(formData.dueDate).toISOString().split("T")[0]
          : null,
        deliveryDate: formData.deliveryDate
          ? new Date(formData.deliveryDate).toISOString().split("T")[0]
          : null,
        // No need to use parseFloat here since freight and boxingCharges are already numbers
        freight: formData.freight,
        boxingCharges: formData.boxingCharges,
        taxRate: formData.taxRate.toFixed(2), // Convert number to string with 2 decimal places
        // Transform null values to empty strings for optional fields
        notes: formData.notes ?? "", // Convert null to empty string
        longDescription: formData.longDescription ?? "", // Convert null to empty string
      };

      console.log("Updated data:", updatedData);

      const method = id && id !== "new" ? "PUT" : "POST";
      const url =
        id && id !== "new" ? `/api/purchasing/${id}` : "/api/purchasing";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error("Error saving purchase order");
      router.push("/purchasing"); // Redirect after saving
    } catch (err) {
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
              {...register("vendorId")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            >
              {vendors.map((vendor: any) => (
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
            />
            {errors.poNumber && (
              <span className="text-red-500">{errors.poNumber.message}</span>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Job Number</label>
            <input
              {...register("jobNumber")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.jobNumber && (
              <span className="text-red-500">{errors.jobNumber.message}</span>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Cost Code</label>
            <input
              {...register("costCode")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.costCode && (
              <span className="text-red-500">{errors.costCode.message}</span>
            )}
          </div>
          <div>
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

        {/* Shipping Info */}
        <div className="grid grid-cols-2 gap-6">
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
          <div>
            <label className="block text-gray-700">Address</label>
            <input
              {...register("shipToAddress")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.shipToAddress && (
              <span className="text-red-500">
                {errors.shipToAddress.message}
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-gray-700">City</label>
              <input
                {...register("shipToCity")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
              {errors.shipToCity && (
                <span className="text-red-500">
                  {errors.shipToCity.message}
                </span>
              )}
            </div>
            <div>
              <label className="block text-gray-700">State</label>
              <select
                {...register("shipToState")}
                className={`w-full px-4 py-2 border ${
                  errors.shipToState ? "border-red-500" : "border-gray-300"
                } rounded-md focus:outline-none focus:ring focus:ring-indigo-100`}
              >
                <option value="">Select a state</option>{" "}
                {/* Default empty option */}
                {stateOptions.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              {errors.shipToState && (
                <span className="text-red-500">
                  {errors.shipToState.message}
                </span>
              )}
            </div>
            <div>
              <label className="block text-gray-700">ZIP Code</label>
              <input
                {...register("shipToZip")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
              {errors.shipToZip && (
                <span className="text-red-500">{errors.shipToZip.message}</span>
              )}
            </div>
          </div>
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

        {/* Charges and Tax */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700">Freight</label>
            <input
              type="number"
              step="0.01"
              {...register("freight", { valueAsNumber: true })} // Proper usage
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.freight && (
              <span className="text-red-500">{errors.freight.message}</span>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Boxing Charges</label>
            <input
              type="number"
              step="0.01"
              {...register("boxingCharges", { valueAsNumber: true })} // Proper usage
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.boxingCharges && (
              <span className="text-red-500">
                {errors.boxingCharges.message}
              </span>
            )}
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("taxable")}
              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              onChange={(e) => setTaxable(e.target.checked)}
            />
            <label className="ml-2 block text-gray-700">Taxable</label>
          </div>
          <div>
            <label className="block text-gray-700">Tax Rate</label>
            <input
              type="number"
              step="0.01"
              {...register("taxRate", { valueAsNumber: true })} // valueAsNumber ensures it's treated as a number
              disabled={!taxable}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.taxRate && (
              <span className="text-red-500">{errors.taxRate.message}</span>
            )}
          </div>
        </div>

        {/* PO Amount, Warranty, Delivery Date, and Notes */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-gray-700">PO Amount</label>
            <input
              type="number"
              step="0.01"
              {...register("poAmount", { valueAsNumber: true })} // Proper usage
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.poAmount && (
              <span className="text-red-500">{errors.poAmount.message}</span>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Warranty Years</label>
            <input
              type="number"
              {...register("warrantyYears")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.warrantyYears && (
              <span className="text-red-500">
                {errors.warrantyYears.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Delivery Date</label>
            <input
              type="date"
              {...register("deliveryDate")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
            />
            {errors.deliveryDate && (
              <span className="text-red-500">
                {errors.deliveryDate.message}
              </span>
            )}
          </div>
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

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-100"
        >
          Save Purchase Order
        </button>
      </form>
    </div>
  );
}
