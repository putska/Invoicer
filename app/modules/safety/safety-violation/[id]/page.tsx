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

const safetyViolationSchema = z.object({
  formName: z.string().default("Safety-Violation"),
  pdfName: z.string().default("SafetyViolation.pdf"),
  userName: z.string().min(1, "User name is required"),
  jobName: z.string().min(1, "Job name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  formData: z.object({
    jobNumber: z.string().optional(),

    // Employee Information
    employeeName: z.string().min(1, "Employee name is required"),
    jobTitle: z.string().min(1, "Job title is required"),
    superintendentName: z.string().min(1, "Superintendent name is required"),
    dateOfViolation: z.string().min(1, "Date of violation is required"),

    // Offense Level
    offenseLevel: z
      .enum(["1st Offence", "2nd Offence", "3rd Offence"])
      .optional(),

    // Corrective Action
    correctiveAction: z
      .enum([
        "Counseling/Retraining",
        "Written Reprimand",
        "Suspension",
        "Termination",
      ])
      .optional(),

    // Violation Details
    violationDescription: z
      .string()
      .min(1, "Violation description is required"),
    employeeExplanation: z.string().optional(),

    // Signatures
    employeeSignature: z.string().optional(),
    employeeSignatureDate: z.string().optional(),
    supervisorSignature: z.string().optional(),
    supervisorSignatureDate: z.string().optional(),

    generatePDF: z.boolean().default(false),
  }),
});

type SafetyViolationForm = z.infer<typeof safetyViolationSchema>;

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

export default function SafetyViolationPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<SafetyViolationForm>({
    resolver: zodResolver(safetyViolationSchema),
    defaultValues: {
      formName: "Safety-Violation",
      pdfName: "SafetyViolation.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "",
      jobName: "",
      formData: {
        jobNumber: "",
        employeeName: "",
        jobTitle: "",
        superintendentName: "",
        dateOfViolation: new Date().toISOString().split("T")[0],
        offenseLevel: undefined,
        correctiveAction: undefined,
        violationDescription: "",
        employeeExplanation: "",
        employeeSignature: "",
        employeeSignatureDate: new Date().toISOString().split("T")[0],
        supervisorSignature: "",
        supervisorSignatureDate: new Date().toISOString().split("T")[0],
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
    async (data: SafetyViolationForm) => {
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

  const loadSafetyViolation = useCallback(
    async (formId: string) => {
      try {
        const response = await fetch(`/api/safety/${formId}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        console.log("Safety Violation API response:", result);

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
            dateOfViolation: form.formData.dateOfViolation
              ? format(new Date(form.formData.dateOfViolation), "yyyy-MM-dd")
              : "",
            employeeSignatureDate: form.formData.employeeSignatureDate
              ? format(
                  new Date(form.formData.employeeSignatureDate),
                  "yyyy-MM-dd"
                )
              : "",
            supervisorSignatureDate: form.formData.supervisorSignatureDate
              ? format(
                  new Date(form.formData.supervisorSignatureDate),
                  "yyyy-MM-dd"
                )
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

        // Now load the safety violation if we're editing
        if (id && id !== "new") {
          await loadSafetyViolation(id);
        } else {
          setStatus("success");
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [id, loadSafetyViolation, loadJobs]);

  // ---------------- Form Submission ----------------

  const onSubmit = async (formData: SafetyViolationForm) => {
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
        {id && id !== "new" ? "Edit Safety Violation" : "New Safety Violation"}
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

          {/* Employee Information Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Employee Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Employee Name"
                error={errors.formData?.employeeName?.message}
                required
              >
                <input
                  {...register("formData.employeeName")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Job Title"
                error={errors.formData?.jobTitle?.message}
                required
              >
                <input
                  {...register("formData.jobTitle")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

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
                label="Date of Violation"
                error={errors.formData?.dateOfViolation?.message}
                required
              >
                <input
                  type="date"
                  {...register("formData.dateOfViolation")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>
          </div>

          {/* Offense and Action Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Offense Level and Corrective Action
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Offense Level */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  Offense Level
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="firstOffense"
                      value="1st Offence"
                      {...register("formData.offenseLevel")}
                      className="mr-2"
                    />
                    <label htmlFor="firstOffense">1st Offence</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="secondOffense"
                      value="2nd Offence"
                      {...register("formData.offenseLevel")}
                      className="mr-2"
                    />
                    <label htmlFor="secondOffense">2nd Offence</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="thirdOffense"
                      value="3rd Offence"
                      {...register("formData.offenseLevel")}
                      className="mr-2"
                    />
                    <label htmlFor="thirdOffense">3rd Offence</label>
                  </div>
                </div>
              </div>

              {/* Corrective Action */}
              <div>
                <h3 className="text-md font-medium text-gray-700 mb-2">
                  Corrective Action
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="counseling"
                      value="Counseling/Retraining"
                      {...register("formData.correctiveAction")}
                      className="mr-2"
                    />
                    <label htmlFor="counseling">Counseling/Retraining</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="writtenReprimand"
                      value="Written Reprimand"
                      {...register("formData.correctiveAction")}
                      className="mr-2"
                    />
                    <label htmlFor="writtenReprimand">Written Reprimand</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="suspension"
                      value="Suspension"
                      {...register("formData.correctiveAction")}
                      className="mr-2"
                    />
                    <label htmlFor="suspension">Suspension</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="termination"
                      value="Termination"
                      {...register("formData.correctiveAction")}
                      className="mr-2"
                    />
                    <label htmlFor="termination">Termination</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Violation Details Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Violation Details
            </h2>

            <FormField
              label="The above-named employee was contacted today regarding the following safety violation:"
              error={errors.formData?.violationDescription?.message}
              required
            >
              <textarea
                {...register("formData.violationDescription")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={6}
              />
            </FormField>

            <FormField
              label="The employee's explanation of their behavior is the following:"
              error={errors.formData?.employeeExplanation?.message}
            >
              <textarea
                {...register("formData.employeeExplanation")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={6}
              />
            </FormField>
          </div>

          {/* Employee Acknowledgment */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <div className="mb-4 italic text-gray-700">
              I (the employee) understand that safety rules and practices are
              necessary to reduce accidents and injuries on the job. Safe
              behavior on the job not only protects me, but my fellow workers as
              well. it is also understood that my employer, by law, must impose
              disciplinary procedures, which could include termination.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Employee Signature"
                error={errors.formData?.employeeSignature?.message}
              >
                <input
                  {...register("formData.employeeSignature")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  placeholder="Type your full name to sign"
                />
              </FormField>

              <FormField
                label="Date"
                error={errors.formData?.employeeSignatureDate?.message}
              >
                <input
                  type="date"
                  {...register("formData.employeeSignatureDate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>
          </div>

          {/* Supervisor Signature */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <div className="mb-4 italic text-gray-700">
              This form is to be filled out by the manager/supervisor and the
              employee. The form will be maintained in the employee's personnel
              file for two years.
            </div>

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
                error={errors.formData?.supervisorSignatureDate?.message}
              >
                <input
                  type="date"
                  {...register("formData.supervisorSignatureDate")}
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
                  Generate PDF for this Safety Violation
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
