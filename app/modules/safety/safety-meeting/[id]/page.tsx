"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  useForm,
  useWatch,
  FormProvider,
  useFormContext,
  useFieldArray,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { generatePDF } from "../../../../components/PdfUtilsSafety";
import { useFullNameFromDB } from "../../../../components/useFullNameFromDB";

// ---------------- Schema & Types ----------------

const safetyMeetingSchema = z.object({
  formName: z.string().default("Safety-Meeting"),
  pdfName: z.string().default("SafetyMeeting.pdf"),
  userName: z.string().min(1, "User name is required"),
  jobName: z.string().min(1, "Job name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  formData: z.object({
    jobNumber: z.string().optional(),

    // Meeting Information
    meetingDate: z.string().min(1, "Meeting date is required"),
    meetingTime: z.string().min(1, "Meeting time is required"),
    weather: z.string().optional(),
    meetingTopic: z.string().min(1, "Meeting topic is required"),

    // Superintendent Information
    superintendentName: z.string().min(1, "Superintendent name is required"),
    superintendentSignature: z.string().optional(),
    signatureDate: z.string().optional(),

    // Attendees - Array of attendees with names and signatures
    attendees: z
      .array(
        z.object({
          name: z.string().optional(),
          signature: z.string().optional(),
        })
      )
      .default([]),

    generatePDF: z.boolean().default(false),
  }),
});

type SafetyMeetingForm = z.infer<typeof safetyMeetingSchema>;

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

export default function SafetyMeetingPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<SafetyMeetingForm>({
    resolver: zodResolver(safetyMeetingSchema),
    defaultValues: {
      formName: "Safety-Meeting",
      pdfName: "SafetyMeeting.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "",
      jobName: "",
      formData: {
        jobNumber: "",
        meetingDate: new Date().toISOString().split("T")[0],
        meetingTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        weather: "",
        meetingTopic: "",
        superintendentName: "",
        superintendentSignature: "",
        signatureDate: new Date().toISOString().split("T")[0],
        attendees: Array(20).fill({ name: "", signature: "" }), // Create 20 empty attendee rows
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

  // Setup for the attendees array field
  const { fields, append, remove } = useFieldArray({
    control,
    name: "formData.attendees",
  });

  // ---------------- Debounced Auto-Save ----------------

  // Watch form values so we can auto-save drafts for existing records
  const watchedValues = useWatch({ control });

  const saveDraft = useCallback(
    async (data: SafetyMeetingForm) => {
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

  const loadSafetyMeeting = useCallback(
    async (formId: string) => {
      try {
        const response = await fetch(`/api/safety/${formId}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        console.log("Safety Meeting API response:", result);

        if (!result.submission) {
          throw new Error(result.error || "Invalid response structure");
        }

        const form = result.submission;

        // Ensure attendees array has the right structure
        let attendees = form.formData.attendees || [];
        // If we have fewer than 20 rows, add empty ones to reach 20
        if (attendees.length < 20) {
          attendees = [
            ...attendees,
            ...Array(20 - attendees.length).fill({ name: "", signature: "" }),
          ];
        }

        // Format dates and reset form values
        reset({
          ...form,
          dateCreated: format(new Date(form.dateCreated), "yyyy-MM-dd"),
          formData: {
            ...form.formData,
            meetingDate: form.formData.meetingDate
              ? format(new Date(form.formData.meetingDate), "yyyy-MM-dd")
              : "",
            signatureDate: form.formData.signatureDate
              ? format(new Date(form.formData.signatureDate), "yyyy-MM-dd")
              : "",
            attendees,
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

        // Now load the safety meeting if we're editing
        if (id && id !== "new") {
          await loadSafetyMeeting(id);
        } else {
          setStatus("success");
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [id, loadSafetyMeeting, loadJobs]);

  // ---------------- Form Submission ----------------

  const onSubmit = async (formData: SafetyMeetingForm) => {
    try {
      console.log("Saving with data:", formData);
      const isNewRecord = !id || id === "new";
      const method = isNewRecord ? "POST" : "PUT";
      const url = isNewRecord ? `/api/safety` : `/api/safety/${id}`;

      // Filter out completely empty attendee rows
      const filteredAttendees = formData.formData.attendees.filter(
        (attendee) => attendee.name || attendee.signature
      );

      const payload = {
        ...formData,
        formData: {
          ...formData.formData,
          attendees: filteredAttendees,
        },
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
          formData: {
            ...formData.formData,
            attendees: filteredAttendees,
          },
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
        {id && id !== "new" ? "Edit Safety Meeting" : "New Safety Meeting"}
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

          {/* Meeting Information Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Meeting Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Meeting Date"
                error={errors.formData?.meetingDate?.message}
                required
              >
                <input
                  type="date"
                  {...register("formData.meetingDate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Meeting Time"
                error={errors.formData?.meetingTime?.message}
                required
              >
                <input
                  type="time"
                  {...register("formData.meetingTime")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Weather"
                error={errors.formData?.weather?.message}
              >
                <input
                  {...register("formData.weather")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  placeholder="Weather conditions"
                />
              </FormField>
            </div>

            <FormField
              label="Meeting Topic"
              error={errors.formData?.meetingTopic?.message}
              required
            >
              <textarea
                {...register("formData.meetingTopic")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={4}
                placeholder="Enter the safety meeting topic and key points discussed"
              />
            </FormField>
          </div>

          {/* Attendance Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Attendance
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border bg-gray-100 text-left">
                      #
                    </th>
                    <th className="px-4 py-2 border bg-gray-100 text-left">
                      Attendant Name
                    </th>
                    <th className="px-4 py-2 border bg-gray-100 text-left">
                      Attendant Signature
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id}>
                      <td className="px-4 py-2 border text-center w-12">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 border">
                        <input
                          {...register(`formData.attendees.${index}.name`)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        />
                      </td>
                      <td className="px-4 py-2 border">
                        <input
                          {...register(`formData.attendees.${index}.signature`)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                          placeholder="Type your full name to sign"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Superintendent Information */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Superintendent Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                label="Superintendent Name"
                error={errors.formData?.superintendentName?.message}
                required
              >
                <input
                  {...register("formData.superintendentName")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Signature"
                error={errors.formData?.superintendentSignature?.message}
              >
                <input
                  {...register("formData.superintendentSignature")}
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
                  Generate PDF for this Safety Meeting
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
