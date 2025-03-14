"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  useForm,
  useWatch,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { generatePDF } from "../../../../components/PdfUtilsSafety";
import { useFullNameFromDB } from "../../../../components/useFullNameFromDB";

// ---------------- Schema & Types ----------------

const nearMissReportSchema = z.object({
  formName: z.string().default("Near-Miss-Report"),
  pdfName: z.string().default("NearMissReport.pdf"),
  userName: z.string().min(1, "User name is required"),
  jobName: z.string().min(1, "Job name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  formData: z.object({
    jobNumber: z.string().optional(),

    // Incident Information
    dateOfIncident: z.string().min(1, "Date of incident is required"),
    timeOfIncident: z.string().min(1, "Time of incident is required"),
    locationOfIncident: z.string().min(1, "Location is required"),
    statementDate: z.string().min(1, "Statement date is required"),
    statementTime: z.string().min(1, "Statement time is required"),
    generalForemanName: z.string().min(1, "General foreman name is required"),

    // Witnesses Information (Optional)
    witnesses: z.string().optional(),
    witnessPhone: z.string().optional(),

    // Report Type Information
    typeOfNearMiss: z
      .enum(["NEAR MISS", "SAFETY CONCERN", "SAFETY IDEA / SUGGESTIONS"])
      .optional(),
    typeOfConcern: z
      .enum([
        "UNSAFE ACT",
        "UNSAFE CONDITION OF AREA",
        "UNSAFE CONDITION OF THE EQUIPMENT",
      ])
      .optional(),

    // Statement Content
    incidentDescription: z.string().min(1, "Description is required"),
    preventionSuggestion: z.string().optional(),
    correctiveActions: z.string().optional(),

    // Signature
    supervisorSignature: z.string().optional(),
    signatureDate: z.string().optional(),

    generatePDF: z.boolean().default(false),
  }),
});

type NearMissReportForm = z.infer<typeof nearMissReportSchema>;

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

type Job = {
  id: number;
  name: string;
  jobNumber: string;
  status: string;
};

// ---------------- Reusable Form Field Components ----------------

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

export default function NearMissReportPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<NearMissReportForm>({
    resolver: zodResolver(nearMissReportSchema),
    defaultValues: {
      formName: "Near-Miss-Report",
      pdfName: "NearMissReport.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "",
      jobName: "",
      formData: {
        jobNumber: "",
        dateOfIncident: new Date().toISOString().split("T")[0],
        timeOfIncident: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        locationOfIncident: "",
        statementDate: new Date().toISOString().split("T")[0],
        statementTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        generalForemanName: "",
        witnesses: "",
        witnessPhone: "",
        typeOfNearMiss: undefined,
        typeOfConcern: undefined,
        incidentDescription: "",
        preventionSuggestion: "",
        correctiveActions: "",
        supervisorSignature: "",
        signatureDate: new Date().toISOString().split("T")[0],
        generatePDF: false,
      },
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, dirtyFields },
    setValue,
    watch,
    clearErrors,
    getValues,
  } = methods;

  // ---------------- Debounced Auto-Save ----------------

  // Watch form values so we can auto-save drafts for existing records
  const watchedValues = useWatch({ control });

  const saveDraft = useCallback(
    async (data: NearMissReportForm) => {
      try {
        const response = await fetch(`/api/near-miss/${id}`, {
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
      setValue("userName", fullName);
    }
  }, [fullName, setValue]);

  // Watch for job name changes to auto-populate job number
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "jobName") {
        // When job name changes, find the matching job
        const selectedJob = jobs.find((job) => job.name === value.jobName);

        if (selectedJob) {
          setValue("formData.jobNumber", selectedJob.jobNumber);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [jobs, setValue, watch, clearErrors, getValues, id]);

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

  const loadNearMissReport = useCallback(
    async (formId: string) => {
      try {
        const response = await fetch(`/api/safety/${formId}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        console.log("Near Miss Report API response:", result);

        if (!result.submission) {
          throw new Error(result.error || "Invalid response structure");
        }

        const form = result.submission;
        // Format dates and reset form values
        reset({
          ...form,
          dateCreated: format(new Date(form.dateCreated), "yyyy-MM-dd"),
          formData: {
            ...form.formData,
            dateOfIncident: form.formData.dateOfIncident
              ? format(new Date(form.formData.dateOfIncident), "yyyy-MM-dd")
              : "",
            statementDate: form.formData.statementDate
              ? format(new Date(form.formData.statementDate), "yyyy-MM-dd")
              : "",
            signatureDate: form.formData.signatureDate
              ? format(new Date(form.formData.signatureDate), "yyyy-MM-dd")
              : "",
          },
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

        // Now load the near miss report if we're editing
        if (id && id !== "new") {
          await loadNearMissReport(id);
        } else {
          setStatus("success");
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [id, loadNearMissReport, loadJobs]);

  // ---------------- Form Submission ----------------

  const onSubmit = async (formData: NearMissReportForm) => {
    try {
      console.log("Saving with data:", formData);
      const isNewRecord = !id || id === "new";
      const method = isNewRecord ? "POST" : "PUT";
      const url = isNewRecord ? `/api/safety` : `/api/safety/${id}`;

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
        {id && id !== "new" ? "Edit Near-Miss Report" : "New Near-Miss Report"}
      </h1>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit, (errors) =>
            console.error("Validation errors:", errors)
          )}
          className="space-y-4"
        >
          {/* Job Selection Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Job Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                label="Job #"
                error={errors.formData?.jobNumber?.message}
              >
                <input
                  {...register("formData.jobNumber")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  readOnly={true}
                />
              </FormField>
            </div>
          </div>

          {/* Incident Information Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Incident Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Date of Incident"
                error={errors.formData?.dateOfIncident?.message}
                required
              >
                <input
                  type="date"
                  {...register("formData.dateOfIncident")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Time of Incident"
                error={errors.formData?.timeOfIncident?.message}
                required
              >
                <input
                  type="time"
                  {...register("formData.timeOfIncident")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Location of Incident"
                error={errors.formData?.locationOfIncident?.message}
                required
              >
                <input
                  {...register("formData.locationOfIncident")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Statement Date"
                error={errors.formData?.statementDate?.message}
                required
              >
                <input
                  type="date"
                  {...register("formData.statementDate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Statement Time"
                error={errors.formData?.statementTime?.message}
                required
              >
                <input
                  type="time"
                  {...register("formData.statementTime")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="General Foreman Name"
                error={errors.formData?.generalForemanName?.message}
                required
              >
                <input
                  {...register("formData.generalForemanName")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>
          </div>

          {/* Witnesses Information Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Witnesses Information (Optional)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Witnesses"
                error={errors.formData?.witnesses?.message}
              >
                <input
                  {...register("formData.witnesses")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Phone #"
                error={errors.formData?.witnessPhone?.message}
              >
                <input
                  {...register("formData.witnessPhone")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>
          </div>

          {/* Report Type Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Report Type
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Type of Near Miss */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  Type of Near Miss
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="nearMiss"
                      value="NEAR MISS"
                      {...register("formData.typeOfNearMiss")}
                      className="mr-2"
                    />
                    <label htmlFor="nearMiss">NEAR MISS</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="safetyConcern"
                      value="SAFETY CONCERN"
                      {...register("formData.typeOfNearMiss")}
                      className="mr-2"
                    />
                    <label htmlFor="safetyConcern">SAFETY CONCERN</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="safetyIdea"
                      value="SAFETY IDEA / SUGGESTIONS"
                      {...register("formData.typeOfNearMiss")}
                      className="mr-2"
                    />
                    <label htmlFor="safetyIdea">
                      SAFETY IDEA / SUGGESTIONS
                    </label>
                  </div>
                </div>
              </div>

              {/* Type of Concern */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  Type of Concern
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="unsafeAct"
                      value="UNSAFE ACT"
                      {...register("formData.typeOfConcern")}
                      className="mr-2"
                    />
                    <label htmlFor="unsafeAct">UNSAFE ACT</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="unsafeArea"
                      value="UNSAFE CONDITION OF AREA"
                      {...register("formData.typeOfConcern")}
                      className="mr-2"
                    />
                    <label htmlFor="unsafeArea">UNSAFE CONDITION OF AREA</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="unsafeEquipment"
                      value="UNSAFE CONDITION OF THE EQUIPMENT"
                      {...register("formData.typeOfConcern")}
                      className="mr-2"
                    />
                    <label htmlFor="unsafeEquipment">
                      UNSAFE CONDITION OF THE EQUIPMENT
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Incident Details
            </h2>

            <FormField
              label="Describe the potential incident/hazard/concern and possible outcome (in as much detail as possible):"
              error={errors.formData?.incidentDescription?.message}
              required
            >
              <textarea
                {...register("formData.incidentDescription")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={6}
              />
            </FormField>

            <FormField
              label="Suggestion/Recommendation for prevention:"
              error={errors.formData?.preventionSuggestion?.message}
            >
              <textarea
                {...register("formData.preventionSuggestion")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={4}
              />
            </FormField>

            <FormField
              label="Corrective Actions Taken:"
              error={errors.formData?.correctiveActions?.message}
            >
              <textarea
                {...register("formData.correctiveActions")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={4}
              />
            </FormField>
          </div>

          {/* Signature Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Supervisor Signature"
                error={errors.formData?.supervisorSignature?.message}
              >
                <input
                  {...register("formData.supervisorSignature")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  placeholder="Type your full name to sign"
                />
              </FormField>

              <FormField
                label="Date"
                error={errors.formData?.signatureDate?.message}
              >
                <input
                  type="date"
                  {...register("formData.signatureDate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
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
                  Generate PDF for this Near-Miss Report
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
      </FormProvider>
    </div>
  );
}
