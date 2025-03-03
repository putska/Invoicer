"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ---------------- Schema ----------------
// Note: This schema only includes the fields your API expects.
const simpleFallProtectionSchema = z.object({
  formName: z.string().default("Fall Protection Inspection Form"),
  pdfName: z.string().default("FallProtection.pdf"),
  jobName: z.string().optional(),
  userName: z.string().min(1, "User name is required"),
  formData: z.object({
    manufacturer: z.string().min(1, "Manufacturer is required"),
    serialNumber: z.string().min(1, "Serial number is required"),
    inspectionDate: z.string().min(1, "Inspection date is required"),
    generatePDF: z.boolean().default(false),
  }),
  submissionDate: z.string().default(() => new Date().toISOString()),
});

type SimpleFallProtectionForm = z.infer<typeof simpleFallProtectionSchema>;

// ---------------- Reusable Field Component ----------------
interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

const FormField = ({
  label,
  error,
  children,
  required = false,
}: FormFieldProps) => (
  <div className="mb-4">
    <label className="block text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <span className="text-red-500 text-sm">{error}</span>}
  </div>
);

// ---------------- Main Component ----------------
export default function SimpleFallProtectionFormPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const [error, setError] = useState<string | null>(null);

  const methods = useForm<SimpleFallProtectionForm>({
    resolver: zodResolver(simpleFallProtectionSchema),
    defaultValues: {
      formName: "Fall Protection Inspection Form",
      pdfName: "FallProtection.pdf",
      jobName: "",
      userName: user?.fullName || "",
      formData: {
        manufacturer: "",
        serialNumber: "",
        inspectionDate: new Date().toISOString().split("T")[0],
        generatePDF: false,
      },
      submissionDate: new Date().toISOString(),
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = methods;

  const onSubmit = async (data: SimpleFallProtectionForm) => {
    try {
      console.log("Submitting data:", data);
      const isNewRecord = !id || id === "new";
      const methodType = isNewRecord ? "POST" : "PUT";
      const url = isNewRecord ? `/api/safety` : `/api/safety/${id}`;

      // Send the payload that matches your API schema.
      const response = await fetch(url, {
        method: methodType,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Server Response:", result);
      router.push("/modules/safety");
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-semibold text-gray-700 mb-6">
        {id && id !== "new"
          ? "Edit Fall Protection Inspection"
          : "New Fall Protection Inspection"}
      </h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <FormField
              label="Manufacturer"
              error={errors.formData?.manufacturer?.message}
              required
            >
              <input
                {...register("formData.manufacturer")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
              />
            </FormField>
            <FormField
              label="Serial Number"
              error={errors.formData?.serialNumber?.message}
              required
            >
              <input
                {...register("formData.serialNumber")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
              />
            </FormField>
            <FormField
              label="Inspection Date"
              error={errors.formData?.inspectionDate?.message}
              required
            >
              <input
                type="date"
                {...register("formData.inspectionDate")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none"
              />
            </FormField>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("formData.generatePDF")}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
              />
              <label className="text-gray-700">Generate PDF</label>
            </div>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push("/modules/safety")}
              className="bg-gray-500 text-white py-2 px-4 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={() => console.log("Button clicked")}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md"
            >
              Save
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
