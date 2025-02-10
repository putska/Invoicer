// /app/vendors/[id]/page.tsx
"use client";
import { useParams, useRouter, useSearchParams } from "next/navigation"; // Use next/navigation instead of next/router
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Define Vendor type and schema
const vendorSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorAddress: z.string().optional(),
  vendorCity: z.string().optional(),
  //vendorState: z.string().length(2, "State must be 2 letters"),
  vendorState: z.string().optional(),
  //vendorZip: z.string().min(5).max(10, "ZIP code is invalid"),
  vendorZip: z.string().optional(),
  vendorPhone: z.string().optional(),
  //vendorEmail: z.string().email().optional(),
  vendorEmail: z.string().optional(),
  vendorContact: z.string().optional(),
  vendorInternalId: z.string().optional(),
  taxable: z.boolean(),
});

type Vendor = z.infer<typeof vendorSchema>;

export default function VendorFormPage() {
  const router = useRouter(); // Use router for redirect
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/modules/vendors"; // default return path if not provided
  const { id } = useParams<{ id: string }>(); // Get the vendor ID from the route using useParams()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Vendor>({
    resolver: zodResolver(vendorSchema),
  });

  // Fetch the vendor by ID
  const loadVendor = async (vendorId: string) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}`);
      if (!response.ok) throw new Error("Error fetching vendor");
      const data = await response.json();
      setValue("vendorName", data.vendor.vendorName);
      setValue("vendorCity", data.vendor.vendorCity);
      setValue("vendorState", data.vendor.vendorState);
      setValue("vendorAddress", data.vendor.vendorAddress);
      setValue("vendorZip", data.vendor.vendorZip);
      setValue("vendorPhone", data.vendor.vendorPhone);
      setValue("vendorEmail", data.vendor.vendorEmail);
      setValue("vendorContact", data.vendor.vendorContact);
      setValue("taxable", data.vendor.taxable);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  // Submit form (either update or create vendor)
  const onSubmit = async (formData: Vendor) => {
    try {
      const method = id && id !== "new" ? "PUT" : "POST";
      const url = id && id !== "new" ? `/api/vendors/${id}` : "/api/vendors";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error("Error saving vendor");
      router.push(returnUrl); // Redirect after saving
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  useEffect(() => {
    if (id && id !== "new") {
      loadVendor(id); // Only load vendor if id exists and is not "new"
    } else {
      setLoading(false); // Skip loading for new vendor creation
    }
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">
        {id && id !== "new" ? "Edit Vendor" : "Add Vendor"}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-gray-700">Vendor Name</label>
          <input
            {...register("vendorName")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.vendorName && (
            <span className="text-red-500">{errors.vendorName.message}</span>
          )}
        </div>

        <div>
          <label className="block text-gray-700">Address</label>
          <input
            {...register("vendorAddress")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.vendorAddress && (
            <span className="text-red-500">{errors.vendorAddress.message}</span>
          )}
        </div>

        <div>
          <label className="block text-gray-700">City</label>
          <input
            {...register("vendorCity")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.vendorCity && (
            <span className="text-red-500">{errors.vendorCity.message}</span>
          )}
        </div>

        <div>
          <label className="block text-gray-700">State</label>
          <input
            {...register("vendorState")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.vendorState && (
            <span className="text-red-500">{errors.vendorState.message}</span>
          )}
        </div>

        <div>
          <label className="block text-gray-700">ZIP Code</label>
          <input
            {...register("vendorZip")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.vendorZip && (
            <span className="text-red-500">{errors.vendorZip.message}</span>
          )}
        </div>

        <div>
          <label className="block text-gray-700">Phone</label>
          <input
            {...register("vendorPhone")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.vendorPhone && (
            <span className="text-red-500">{errors.vendorPhone.message}</span>
          )}
        </div>

        <div>
          <label className="block text-gray-700">Email</label>
          <input
            {...register("vendorEmail")}
            type="email"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.vendorEmail && (
            <span className="text-red-500">{errors.vendorEmail.message}</span>
          )}
        </div>

        <div>
          <label className="block text-gray-700">Contact Person</label>
          <input
            {...register("vendorContact")}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
          {errors.vendorContact && (
            <span className="text-red-500">{errors.vendorContact.message}</span>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            {...register("taxable")}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label className="ml-2 block text-gray-700">Taxable</label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push(returnUrl)}
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
