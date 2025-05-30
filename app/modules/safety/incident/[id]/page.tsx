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

const incidentReportSchema = z.object({
  formName: z.string().default("Incident-Report"),
  pdfName: z.string().default("IncidentReport.pdf"),
  userName: z.string().min(1, "User name is required"),
  jobName: z.string().min(1, "Job name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  formData: z.object({
    jobNumber: z.string().optional(),

    // Incident Basic Information
    dateOfIncident: z.string().min(1, "Date of incident is required"),
    timeOfIncident: z.string().min(1, "Time of incident is required"),
    statementDate: z.string().optional(),
    statementTime: z.string().optional(),
    locationOfIncident: z.string().min(1, "Location of incident is required"),
    superintendentName: z.string().min(1, "Superintendent name is required"),

    // Employee Information
    employeeName: z.string().min(1, "Employee name is required"),
    employeePhone: z.string().optional(),

    // Type of Incident (checkboxes)
    incidentTypes: z
      .object({
        nearMiss: z.boolean().default(false),
        firstAid: z.boolean().default(false),
        motorVehicle: z.boolean().default(false),
        propertyDamage: z.boolean().default(false),
        nonWorkRelated: z.boolean().default(false),
        other: z.boolean().default(false),
      })
      .default({}),
    otherIncidentType: z.string().optional(),

    // Incident Details
    incidentDescription: z.string().min(1, "Incident description is required"),
    witnesses: z.string().optional(),
    contributingFactors: z.string().optional(),
    rootCause: z.string().optional(),
    preventionSuggestion: z.string().optional(),
    preventionAction: z.string().optional(),

    // Medical Treatment
    wantsMedicalTreatment: z
      .enum(["yes", "no", "not_selected"])
      .default("not_selected"),
    employeeInitials: z.string().optional(),

    // Signatures
    employeeSignature: z.string().optional(),
    employeeSignatureDate: z.string().optional(),
    superintendentSignature: z.string().optional(),
    superintendentSignatureDate: z.string().optional(),

    generatePDF: z.boolean().default(false),
  }),
});

type IncidentReportForm = z.infer<typeof incidentReportSchema>;

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

export default function IncidentReportPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<IncidentReportForm>({
    resolver: zodResolver(incidentReportSchema),
    defaultValues: {
      formName: "Incident-Report",
      pdfName: "IncidentReport.pdf",
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
        statementDate: new Date().toISOString().split("T")[0],
        statementTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        locationOfIncident: "",
        superintendentName: "",
        employeeName: "",
        employeePhone: "",
        incidentTypes: {
          nearMiss: false,
          firstAid: false,
          motorVehicle: false,
          propertyDamage: false,
          nonWorkRelated: false,
          other: false,
        },
        otherIncidentType: "",
        incidentDescription: "",
        witnesses: "",
        contributingFactors: "",
        rootCause: "",
        preventionSuggestion: "",
        preventionAction: "",
        wantsMedicalTreatment: "not_selected",
        employeeInitials: "",
        employeeSignature: "",
        employeeSignatureDate: new Date().toISOString().split("T")[0],
        superintendentSignature: "",
        superintendentSignatureDate: new Date().toISOString().split("T")[0],
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

  const watchedValues = useWatch({ control });

  const saveDraft = useCallback(
    async (data: IncidentReportForm) => {
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

      const jobsToSet =
        id && id !== "new"
          ? result.projects
          : result.projects.filter((job: Job) => job.status === "active");

      setJobs(jobsToSet);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  }, [id]);

  const loadIncidentReport = useCallback(
    async (formId: string) => {
      try {
        const response = await fetch(`/api/safety/${formId}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        console.log("Incident Report API response:", result);

        if (!result.submission) {
          throw new Error(result.error || "Invalid response structure");
        }

        const form = result.submission;

        // Verify this is actually an incident report
        if (form.formName !== "Incident-Report") {
          throw new Error("This form is not an incident report");
        }

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
            employeeSignatureDate: form.formData.employeeSignatureDate
              ? format(
                  new Date(form.formData.employeeSignatureDate),
                  "yyyy-MM-dd"
                )
              : "",
            superintendentSignatureDate: form.formData
              .superintendentSignatureDate
              ? format(
                  new Date(form.formData.superintendentSignatureDate),
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
        await loadJobs();
        if (id && id !== "new") {
          await loadIncidentReport(id);
        } else {
          setStatus("success");
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [id, loadIncidentReport, loadJobs]);

  // ---------------- Form Submission ----------------

  const onSubmit = async (formData: IncidentReportForm) => {
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
        {id && id !== "new" ? "Edit Incident Report" : "New Incident Report"}
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

          {/* Incident Basic Information */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Incident Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                label="Statement Date"
                error={errors.formData?.statementDate?.message}
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
              >
                <input
                  type="time"
                  {...register("formData.statementTime")}
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
                  placeholder="Enter incident location"
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
            </div>
          </div>

          {/* Employee Information */}
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
                label="Phone #"
                error={errors.formData?.employeePhone?.message}
              >
                <input
                  {...register("formData.employeePhone")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  placeholder="(555) 123-4567"
                />
              </FormField>
            </div>
          </div>

          {/* Type of Incident */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Type of Incident
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="nearMiss"
                  {...register("formData.incidentTypes.nearMiss")}
                  className="mr-2"
                />
                <label htmlFor="nearMiss" className="text-gray-700">
                  Near Miss
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="firstAid"
                  {...register("formData.incidentTypes.firstAid")}
                  className="mr-2"
                />
                <label htmlFor="firstAid" className="text-gray-700">
                  First Aid
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="motorVehicle"
                  {...register("formData.incidentTypes.motorVehicle")}
                  className="mr-2"
                />
                <label htmlFor="motorVehicle" className="text-gray-700">
                  Motor Vehicle
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="propertyDamage"
                  {...register("formData.incidentTypes.propertyDamage")}
                  className="mr-2"
                />
                <label htmlFor="propertyDamage" className="text-gray-700">
                  Property Damage
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="nonWorkRelated"
                  {...register("formData.incidentTypes.nonWorkRelated")}
                  className="mr-2"
                />
                <label htmlFor="nonWorkRelated" className="text-gray-700">
                  Non-Work Related
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="other"
                  {...register("formData.incidentTypes.other")}
                  className="mr-2"
                />
                <label htmlFor="other" className="text-gray-700">
                  Other
                </label>
              </div>
            </div>

            {watch("formData.incidentTypes.other") && (
              <FormField
                label="Specify Other"
                error={errors.formData?.otherIncidentType?.message}
              >
                <input
                  {...register("formData.otherIncidentType")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  placeholder="Please specify"
                />
              </FormField>
            )}
          </div>

          {/* Incident Details */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Incident Details
            </h2>

            <FormField
              label="Describe clearly how the incident occurred (What Happened?)"
              error={errors.formData?.incidentDescription?.message}
              required
            >
              <textarea
                {...register("formData.incidentDescription")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={4}
                placeholder="Provide a detailed description of what happened"
              />
            </FormField>

            <FormField
              label="Witnesses: (Name & Phone Number)"
              error={errors.formData?.witnesses?.message}
            >
              <textarea
                {...register("formData.witnesses")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={3}
                placeholder="List witnesses with their contact information"
              />
            </FormField>

            <FormField
              label="What are the contributing Factors:"
              error={errors.formData?.contributingFactors?.message}
            >
              <textarea
                {...register("formData.contributingFactors")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={3}
                placeholder="Describe factors that contributed to the incident"
              />
            </FormField>

            <FormField
              label="What is the Root Cause? (Underlying reason why this incident happened)"
              error={errors.formData?.rootCause?.message}
            >
              <textarea
                {...register("formData.rootCause")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={3}
                placeholder="Identify the root cause of the incident"
              />
            </FormField>

            <FormField
              label="Suggestion/Recommendation for prevention:"
              error={errors.formData?.preventionSuggestion?.message}
            >
              <textarea
                {...register("formData.preventionSuggestion")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={3}
                placeholder="Suggest ways to prevent similar incidents"
              />
            </FormField>

            <FormField
              label="What action has or will be taken to prevent recurrence?"
              error={errors.formData?.preventionAction?.message}
            >
              <textarea
                {...register("formData.preventionAction")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={3}
                placeholder="Describe actions taken or planned to prevent recurrence"
              />
            </FormField>
          </div>

          {/* Medical Treatment Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Medical Treatment
            </h2>

            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  id="wantsTreatment"
                  value="yes"
                  {...register("formData.wantsMedicalTreatment")}
                  className="mr-2"
                />
                <label htmlFor="wantsTreatment" className="text-gray-700">
                  I do want to visit a clinic for additional medical treatment
                  at this time.
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <input
                  type="radio"
                  id="noTreatment"
                  value="no"
                  {...register("formData.wantsMedicalTreatment")}
                  className="mr-2"
                />
                <label htmlFor="noTreatment" className="text-gray-700">
                  I do not want to visit a clinic for additional medical
                  treatment at this time.
                </label>
              </div>

              <FormField
                label="Employee Initials"
                error={errors.formData?.employeeInitials?.message}
              >
                <input
                  {...register("formData.employeeInitials")}
                  className="w-32 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  placeholder="Initials"
                  maxLength={4}
                />
              </FormField>
            </div>
          </div>

          {/* Signatures Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Signatures
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  Employee
                </h3>
                <div className="space-y-4">
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

              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-3">
                  Superintendent
                </h3>
                <div className="space-y-4">
                  <FormField
                    label="Superintendent Signature"
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
                    error={
                      errors.formData?.superintendentSignatureDate?.message
                    }
                  >
                    <input
                      type="date"
                      {...register("formData.superintendentSignatureDate")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>
                </div>
              </div>
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
                  Generate PDF for this Incident Report
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
