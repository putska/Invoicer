"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useForm, useWatch, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { generatePDF } from "../../../../components/PdfUtilsSafety";
import { useFullNameFromDB } from "../../../../components/useFullNameFromDB";

// ---------------- Schema & Types ----------------

const jhaFormSchema = z.object({
  formName: z.string().default("Job Hazard Analysis"),
  pdfName: z.string().default("JHA.pdf"),
  jobName: z.string().min(1, "Job name is required"),
  jobNumber: z.string().min(1, "Job number is required"),
  userName: z.string().min(1, "User name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  shiftTime: z.string().optional(),
  formData: z.object({
    weather: z.string().min(1, "Weather condition is required"),
    competentPersonName: z.string().min(1, "Competent person name is required"),
    phoneNumber: z.string().min(1, "Phone number is required"),
    workDescription: z.string().min(1, "Work description is required"),
    tasks: z
      .array(
        z.object({
          task: z.string().min(1, "Task is required"),
          hazard: z.string().min(1, "Hazard is required"),
          control: z.string().min(1, "Control is required"),
        })
      )
      .min(1, "At least one task analysis is required"),
    ppeRequirements: z.object({
      hardHat: z.boolean().default(false),
      safetyShoes: z.boolean().default(false),
      safetyGlasses: z.boolean().default(false),
      protectiveGloves: z.boolean().default(false),
      dustMask: z.boolean().default(false),
      hearingProtection: z.boolean().default(false),
      fallProtection: z.boolean().default(false),
      faceShield: z.boolean().default(false),
      other1: z.string().optional(),
      other2: z.string().optional(),
      other3: z.string().optional(),
      other4: z.string().optional(),
    }),
    notes: z.string().optional(),
    supervisorName: z.string().min(1, "Supervisor name is required"),
    supervisorSignature: z.string().optional(),
    emergencyContacts: z.array(z.string()).optional(),
    generatePDF: z.boolean().default(false),
  }),
});

type JHAForm = z.infer<typeof jhaFormSchema>;

type Job = {
  id: number;
  name: string;
  number: string;
  status: string;
};

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

// ---------------- Reusable Form Field Component ----------------

const FormField = ({
  label,
  error,
  children,
  required = false,
}: FormFieldProps) => (
  <div className="mb-4">
    <label className="block text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && <span className="text-red-500 text-sm">{error}</span>}
  </div>
);

// ---------------- Main Component ----------------

export default function JHAFormPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [jobs, setJobs] = useState<Job[]>([]);
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
    watch,
  } = useForm<JHAForm>({
    resolver: zodResolver(jhaFormSchema),
    defaultValues: {
      formName: "JHA",
      pdfName: "JHA.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "Stephen Watts",
      formData: {
        weather: "",
        competentPersonName: "",
        phoneNumber: "",
        workDescription: "",
        tasks: [{ task: "", hazard: "", control: "" }],
        ppeRequirements: {
          hardHat: false,
          safetyShoes: false,
          safetyGlasses: false,
          protectiveGloves: false,
          dustMask: false,
          hearingProtection: false,
          fallProtection: false,
          faceShield: false,
        },
        notes: "",
        supervisorName: "",
        supervisorSignature: "",
        emergencyContacts: [],
        generatePDF: false,
      },
    },
  });

  // Field array for tasks
  const { fields, append, remove } = useFieldArray({
    control,
    name: "formData.tasks",
  });

  // ---------------- Debounced Auto-Save ----------------

  // Watch form values so we can auto-save drafts for existing records
  const watchedValues = useWatch({ control });

  const saveDraft = useCallback(
    async (data: JHAForm) => {
      try {
        const response = await fetch(`/api/safety/${id}`, {
          method: "PUT",
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

  // Update fields when fullName changes
  useEffect(() => {
    if (fullName) {
      setValue("formData.competentPersonName", fullName);
    }
  }, [fullName, setValue]);

  // ---------------- API Loaders ----------------

  const loadJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.projects) throw new Error("Failed to load jobs");

      // If we're editing (id exists and isn't "new"), show all jobs.
      // Otherwise, for a new form, show only active jobs.
      const jobsToSet =
        id && id !== "new"
          ? result.projects
          : result.projects.filter((job: Job) => job.status === "active");

      setJobs(jobsToSet);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  }, [id]);

  const loadSafetyForm = useCallback(
    async (formId: string) => {
      try {
        const response = await fetch(`/api/safety/${formId}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        console.log("Safety Form API response:", result);

        if (!result.submission) {
          throw new Error(result.error || "Invalid response structure");
        }

        const form = result.submission;
        // Format dates and reset form values
        reset({
          ...form,
          dateCreated: format(new Date(form.dateCreated), "yyyy-MM-dd"),
        });

        setStatus("success");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        setStatus("error");
      }
    },
    [reset]
  );

  useEffect(() => {
    async function fetchData() {
      try {
        // Wait for dropdown data to load
        await loadJobs();

        // Now load the safety form if we're editing
        if (id && id !== "new") {
          await loadSafetyForm(id);
        } else {
          setStatus("success");
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [id, loadSafetyForm, loadJobs]);

  // ---------------- Form Submission ----------------

  const onSubmit = async (formData: JHAForm) => {
    try {
      console.log("Saving with data:", formData);
      const isNewRecord = !id || id === "new";
      const method = isNewRecord ? "POST" : "PUT";
      const url = isNewRecord ? `/api/safety` : `/api/safety/${id}`;

      // Get job name for PDF generation
      const selectedJob = jobs.find((j) => j.name === formData.jobName);

      const payload = {
        ...formData,
        submissionDate: new Date().toISOString(),
      };

      console.log("Saving data:", payload);
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = await response.json();
      console.log("Server Response:", result);

      if (isNewRecord && formData.formData.generatePDF) {
        console.log("Printing form:", formData.formName, id);
        generatePDF({
          id: id,
          formName: formData.formName,
          pdfName: formData.pdfName,
          jobName: formData.jobName,
          userName: formData.userName,
          dateCreated: formData.dateCreated,
          submissionDate: Date(),
          formData: formData.formData,
        });
      }

      router.push("/modules/safety");
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
        {id && id !== "new"
          ? "Edit Job Hazard Analysis"
          : "New Job Hazard Analysis"}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Site Information Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-medium text-gray-700 mb-4">
            Site Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Date"
              error={errors.dateCreated?.message}
              required
            >
              <input
                type="date"
                {...register("dateCreated")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Time of Shift" error={errors.shiftTime?.message}>
              <input
                type="time"
                {...register("shiftTime")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>

            <FormField
              label="Weather Condition"
              error={errors.formData?.weather?.message}
              required
            >
              <input
                {...register("formData.weather")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                placeholder="Clear, Rainy, etc."
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              label="Job Name"
              error={errors.jobName?.message}
              required
            >
              <select
                {...register("jobName")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              >
                <option value="">Select a Job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.name}>
                    {job.name}
                  </option>
                ))}
              </select>
            </FormField>

            <FormField
              label="Job Number"
              error={errors.jobNumber?.message}
              required
            >
              <input
                {...register("jobNumber")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>
          </div>
        </div>

        {/* Competent Person Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-medium text-gray-700 mb-4">
            Competent Person
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Name"
              error={errors.formData?.competentPersonName?.message}
              required
            >
              <input
                {...register("formData.competentPersonName")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>

            <FormField
              label="Phone Number"
              error={errors.formData?.phoneNumber?.message}
              required
            >
              <input
                {...register("formData.phoneNumber")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                placeholder="(123) 456-7890"
              />
            </FormField>
          </div>
        </div>

        {/* Work Description Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-medium text-gray-700 mb-4">
            Location & Brief Description of Task
          </h2>

          <FormField
            label="Work Description"
            error={errors.formData?.workDescription?.message}
            required
          >
            <textarea
              {...register("formData.workDescription")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              rows={3}
            />
          </FormField>
        </div>

        {/* Task Analysis Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-medium text-gray-700 mb-4">
            Tasks, Potential Hazards & Controls
          </h2>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200"
            >
              <FormField
                label={`Task ${index + 1}`}
                error={errors.formData?.tasks?.[index]?.task?.message}
                required
              >
                <input
                  {...register(`formData.tasks.${index}.task` as const)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Potential Hazard"
                error={errors.formData?.tasks?.[index]?.hazard?.message}
                required
              >
                <input
                  {...register(`formData.tasks.${index}.hazard` as const)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <div className="flex items-start">
                <div className="flex-grow">
                  <FormField
                    label="Control"
                    error={errors.formData?.tasks?.[index]?.control?.message}
                    required
                  >
                    <input
                      {...register(`formData.tasks.${index}.control` as const)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>
                </div>
                {fields.length > 1 && (
                  <button
                    type="button"
                    className="mt-8 ml-2 bg-red-500 text-white p-2 rounded-md hover:bg-red-600"
                    onClick={() => remove(index)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            className="mt-2 bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600"
            onClick={() => append({ task: "", hazard: "", control: "" })}
          >
            Add Task
          </button>
        </div>

        {/* PPE Requirements Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-medium text-gray-700 mb-4">
            Required Personal Protective Equipment
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="hardHat"
                {...register("formData.ppeRequirements.hardHat")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="hardHat"
                className="ml-2 block text-sm text-gray-700"
              >
                Hard Hat
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="safetyShoes"
                {...register("formData.ppeRequirements.safetyShoes")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="safetyShoes"
                className="ml-2 block text-sm text-gray-700"
              >
                Safety Shoes
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="safetyGlasses"
                {...register("formData.ppeRequirements.safetyGlasses")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="safetyGlasses"
                className="ml-2 block text-sm text-gray-700"
              >
                Safety Glasses
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="protectiveGloves"
                {...register("formData.ppeRequirements.protectiveGloves")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="protectiveGloves"
                className="ml-2 block text-sm text-gray-700"
              >
                Protective Gloves
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="dustMask"
                {...register("formData.ppeRequirements.dustMask")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="dustMask"
                className="ml-2 block text-sm text-gray-700"
              >
                Dust Mask
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="hearingProtection"
                {...register("formData.ppeRequirements.hearingProtection")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="hearingProtection"
                className="ml-2 block text-sm text-gray-700"
              >
                Hearing Protection
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="fallProtection"
                {...register("formData.ppeRequirements.fallProtection")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="fallProtection"
                className="ml-2 block text-sm text-gray-700"
              >
                Fall Protection
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="faceShield"
                {...register("formData.ppeRequirements.faceShield")}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor="faceShield"
                className="ml-2 block text-sm text-gray-700"
              >
                Face Shield
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <FormField label="Other" error={undefined}>
              <input
                {...register("formData.ppeRequirements.other1")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Other" error={undefined}>
              <input
                {...register("formData.ppeRequirements.other2")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Other" error={undefined}>
              <input
                {...register("formData.ppeRequirements.other3")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>

            <FormField label="Other" error={undefined}>
              <input
                {...register("formData.ppeRequirements.other4")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-medium text-gray-700 mb-4">Notes</h2>

          <FormField label="" error={errors.formData?.notes?.message}>
            <textarea
              {...register("formData.notes")}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              rows={3}
            />
          </FormField>
        </div>

        {/* Supervisor Section */}
        <div className="bg-gray-50 p-4 rounded-md mb-6">
          <h2 className="text-xl font-medium text-gray-700 mb-4">
            Supervisor/Foreman
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Name"
              error={errors.formData?.supervisorName?.message}
              required
            >
              <input
                {...register("formData.supervisorName")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
              />
            </FormField>

            <FormField
              label="Digital Signature"
              error={errors.formData?.supervisorSignature?.message}
            >
              <input
                {...register("formData.supervisorSignature")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                placeholder="Type name to sign"
              />
            </FormField>
          </div>
        </div>

        {/* PDF Generation Option */}
        {(!id || id === "new") && (
          <FormField label="">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="generatePDF"
                {...register("formData.generatePDF")}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="generatePDF" className="text-gray-700">
                Generate PDF for this Job Hazard Analysis
              </label>
            </div>
          </FormField>
        )}

        {/* Form Buttons */}
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => router.push("/modules/safety")}
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
