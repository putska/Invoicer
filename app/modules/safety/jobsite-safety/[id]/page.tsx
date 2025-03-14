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

const jobsiteSafetySchema = z.object({
  formName: z.string().default("Jobsite Safety Inspection"),
  pdfName: z.string().default("JobsiteSafetyInspection.pdf"),
  userName: z.string().min(1, "User name is required"),
  jobName: z.string().min(1, "Job name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  formData: z.object({
    jobNumber: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    superintendent: z.string().min(1, "Superintendent name is required"),
    weather: z.string().optional(),

    // Checklist Items
    safetyItems: z.object({
      // Item 1-13
      toolboxMeetings: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      safetyProgram: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      heatIllnessPrevention: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      emergencyEvacuation: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      firstAid: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      hazardCommunication: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      ppe: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      scaffolds: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      housekeeping: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      mobileElevatingPlatforms: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      fallProtection: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      laddersStairways: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      fireSafety: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),

      // Item 14-25
      lockoutTagout: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      electricalSafety: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      flammableLiquids: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      hotWorkOperations: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      powerTools: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      forkliftOperations: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      cranes: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      riggingEquipment: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      confinedSpace: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      publicProtection: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      excavationTrenching: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
      other: z.object({
        satisfactory: z.boolean().default(false),
        improvement: z.boolean().default(false),
        notApplicable: z.boolean().default(false),
      }),
    }),

    // Notes and Corrective Actions
    notes: z.string().optional(),
    correctiveActions: z
      .array(
        z.object({
          itemNumber: z.string().optional(),
          dateCorrected: z.string().optional(),
          actionTaken: z.string().optional(),
        })
      )
      .default([{}, {}, {}, {}, {}]), // Default 5 empty corrective action rows

    generatePDF: z.boolean().default(false),
  }),
});

type JobsiteSafetyForm = z.infer<typeof jobsiteSafetySchema>;

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

interface CheckboxTrioFieldProps {
  label: string;
  satisfactoryName: string;
  improvementName: string;
  notApplicableName: string;
  register: any;
  errors?: any;
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

const CheckboxTrioField = ({
  label,
  satisfactoryName,
  improvementName,
  notApplicableName,
  register,
  errors,
}: CheckboxTrioFieldProps) => {
  // Get the setValue function from useForm context
  const { setValue, watch } = useFormContext();

  // Watch the current values
  const satisfactoryValue = watch(satisfactoryName);
  const improvementValue = watch(improvementName);
  const notApplicableValue = watch(notApplicableName);

  // Handle radio-like behavior when Satisfactory is clicked
  const handleSatisfactoryClick = () => {
    setValue(satisfactoryName, true);
    setValue(improvementName, false);
    setValue(notApplicableName, false);
  };

  // Handle radio-like behavior when Improvement is clicked
  const handleImprovementClick = () => {
    setValue(satisfactoryName, false);
    setValue(improvementName, true);
    setValue(notApplicableName, false);
  };

  // Handle radio-like behavior when N/A is clicked
  const handleNotApplicableClick = () => {
    setValue(satisfactoryName, false);
    setValue(improvementName, false);
    setValue(notApplicableName, true);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center mb-2 py-2 border-b border-gray-100">
      <div className="col-span-6">{label}</div>
      <div className="col-span-2 flex items-center justify-center">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={satisfactoryName}
            {...register(satisfactoryName)}
            checked={satisfactoryValue}
            onChange={handleSatisfactoryClick}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label
            htmlFor={satisfactoryName}
            className="ml-1 block text-sm text-gray-700"
          >
            S
          </label>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-center">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={improvementName}
            {...register(improvementName)}
            checked={improvementValue}
            onChange={handleImprovementClick}
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label
            htmlFor={improvementName}
            className="ml-1 block text-sm text-gray-700"
          >
            I
          </label>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-center">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={notApplicableName}
            {...register(notApplicableName)}
            checked={notApplicableValue}
            onChange={handleNotApplicableClick}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label
            htmlFor={notApplicableName}
            className="ml-1 block text-sm text-gray-700"
          >
            N/A
          </label>
        </div>
      </div>
    </div>
  );
};

// ---------------- Main Component ----------------

export default function JobsiteSafetyInspectionPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<JobsiteSafetyForm>({
    resolver: zodResolver(jobsiteSafetySchema),
    defaultValues: {
      formName: "Jobsite-Safety-Inspection",
      pdfName: "JobsiteSafetyInspection.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "",
      jobName: "",
      formData: {
        jobNumber: "",
        address: "",
        superintendent: "",
        weather: "",
        safetyItems: {
          toolboxMeetings: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          safetyProgram: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          heatIllnessPrevention: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          emergencyEvacuation: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          firstAid: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          hazardCommunication: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          ppe: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          scaffolds: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          housekeeping: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          mobileElevatingPlatforms: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          fallProtection: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          laddersStairways: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          fireSafety: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          lockoutTagout: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          electricalSafety: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          flammableLiquids: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          hotWorkOperations: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          powerTools: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          forkliftOperations: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          cranes: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          riggingEquipment: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          confinedSpace: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          publicProtection: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          excavationTrenching: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
          other: {
            satisfactory: false,
            improvement: false,
            notApplicable: false,
          },
        },
        notes: "",
        correctiveActions: [{}, {}, {}, {}, {}],
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
    async (data: JobsiteSafetyForm) => {
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
  }, [id, loadSafetyForm]);

  // ---------------- Form Submission ----------------

  const onSubmit = async (formData: JobsiteSafetyForm) => {
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
        {id && id !== "new"
          ? "Edit Jobsite Safety Inspection"
          : "New Jobsite Safety Inspection"}
      </h1>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit, (errors) =>
            console.error("Validation errors:", errors)
          )}
          className="space-y-4"
        >
          {/* Project Information Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Project Information
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

              <FormField
                label="Address"
                error={errors.formData?.address?.message}
                required
              >
                <input
                  {...register("formData.address")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Job #"
                error={errors.formData?.jobNumber?.message}
                required
              >
                <input
                  {...register("formData.jobNumber")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  readOnly={true}
                />
              </FormField>

              <FormField
                label="Superintendent"
                error={errors.formData?.superintendent?.message}
                required
              >
                <input
                  {...register("formData.superintendent")}
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
                />
              </FormField>
            </div>
          </div>

          {/* Safety Checklist - Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Items 1-13 */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="text-xl font-medium text-gray-700 mb-4">
                Safety Checklist - Part 1
              </h2>

              <div className="mb-2 bg-blue-50 py-2 px-2 rounded">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6 font-semibold">Item</div>
                  <div className="col-span-2 text-center font-semibold text-green-600">
                    S
                  </div>
                  <div className="col-span-2 text-center font-semibold text-yellow-600">
                    I
                  </div>
                  <div className="col-span-2 text-center font-semibold text-blue-600">
                    N/A
                  </div>
                </div>
              </div>

              <CheckboxTrioField
                label="1) Toolbox Safety Meetings & Job Hazard Analysis (JHA)"
                satisfactoryName="formData.safetyItems.toolboxMeetings.satisfactory"
                improvementName="formData.safetyItems.toolboxMeetings.improvement"
                notApplicableName="formData.safetyItems.toolboxMeetings.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="2) IIPP, Safety Program (COSP)"
                satisfactoryName="formData.safetyItems.safetyProgram.satisfactory"
                improvementName="formData.safetyItems.safetyProgram.improvement"
                notApplicableName="formData.safetyItems.safetyProgram.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="3) Heat Illness Prevention"
                satisfactoryName="formData.safetyItems.heatIllnessPrevention.satisfactory"
                improvementName="formData.safetyItems.heatIllnessPrevention.improvement"
                notApplicableName="formData.safetyItems.heatIllnessPrevention.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="4) Emergency Evacuation, Exits/Egress"
                satisfactoryName="formData.safetyItems.emergencyEvacuation.satisfactory"
                improvementName="formData.safetyItems.emergencyEvacuation.improvement"
                notApplicableName="formData.safetyItems.emergencyEvacuation.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="5) First Aid / Eye Wash"
                satisfactoryName="formData.safetyItems.firstAid.satisfactory"
                improvementName="formData.safetyItems.firstAid.improvement"
                notApplicableName="formData.safetyItems.firstAid.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="6) Hazard Communication & Safety Data Sheets"
                satisfactoryName="formData.safetyItems.hazardCommunication.satisfactory"
                improvementName="formData.safetyItems.hazardCommunication.improvement"
                notApplicableName="formData.safetyItems.hazardCommunication.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="7) Personal Protective Equipment (PPE)"
                satisfactoryName="formData.safetyItems.ppe.satisfactory"
                improvementName="formData.safetyItems.ppe.improvement"
                notApplicableName="formData.safetyItems.ppe.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="8) Scaffolds"
                satisfactoryName="formData.safetyItems.scaffolds.satisfactory"
                improvementName="formData.safetyItems.scaffolds.improvement"
                notApplicableName="formData.safetyItems.scaffolds.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="9) Housekeeping /Site Conditions"
                satisfactoryName="formData.safetyItems.housekeeping.satisfactory"
                improvementName="formData.safetyItems.housekeeping.improvement"
                notApplicableName="formData.safetyItems.housekeeping.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="10) Mobile Elevating Work Platforms"
                satisfactoryName="formData.safetyItems.mobileElevatingPlatforms.satisfactory"
                improvementName="formData.safetyItems.mobileElevatingPlatforms.improvement"
                notApplicableName="formData.safetyItems.mobileElevatingPlatforms.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="11) Fall Protection"
                satisfactoryName="formData.safetyItems.fallProtection.satisfactory"
                improvementName="formData.safetyItems.fallProtection.improvement"
                notApplicableName="formData.safetyItems.fallProtection.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="12) Ladders/Stairways"
                satisfactoryName="formData.safetyItems.laddersStairways.satisfactory"
                improvementName="formData.safetyItems.laddersStairways.improvement"
                notApplicableName="formData.safetyItems.laddersStairways.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="13) Fire Safety/Fire Protection"
                satisfactoryName="formData.safetyItems.fireSafety.satisfactory"
                improvementName="formData.safetyItems.fireSafety.improvement"
                notApplicableName="formData.safetyItems.fireSafety.notApplicable"
                register={register}
                errors={errors}
              />
            </div>

            {/* Right Column - Items 14-25 */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h2 className="text-xl font-medium text-gray-700 mb-4">
                Safety Checklist - Part 2
              </h2>

              <div className="mb-2 bg-blue-50 py-2 px-2 rounded">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6 font-semibold">Item</div>
                  <div className="col-span-2 text-center font-semibold text-green-600">
                    S
                  </div>
                  <div className="col-span-2 text-center font-semibold text-yellow-600">
                    I
                  </div>
                  <div className="col-span-2 text-center font-semibold text-blue-600">
                    N/A
                  </div>
                </div>
              </div>

              <CheckboxTrioField
                label="14) Lock Out/Tag Out (LOTO)"
                satisfactoryName="formData.safetyItems.lockoutTagout.satisfactory"
                improvementName="formData.safetyItems.lockoutTagout.improvement"
                notApplicableName="formData.safetyItems.lockoutTagout.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="15) Electrical Safety"
                satisfactoryName="formData.safetyItems.electricalSafety.satisfactory"
                improvementName="formData.safetyItems.electricalSafety.improvement"
                notApplicableName="formData.safetyItems.electricalSafety.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="16) Flammable and Combustible Liquids"
                satisfactoryName="formData.safetyItems.flammableLiquids.satisfactory"
                improvementName="formData.safetyItems.flammableLiquids.improvement"
                notApplicableName="formData.safetyItems.flammableLiquids.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="17) Hot Work Operations-Welding/Cutting"
                satisfactoryName="formData.safetyItems.hotWorkOperations.satisfactory"
                improvementName="formData.safetyItems.hotWorkOperations.improvement"
                notApplicableName="formData.safetyItems.hotWorkOperations.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="18) Power Tools/Hand Tools, Powder Actuated Tool (PAT)"
                satisfactoryName="formData.safetyItems.powerTools.satisfactory"
                improvementName="formData.safetyItems.powerTools.improvement"
                notApplicableName="formData.safetyItems.powerTools.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="19) Forklift-Heavy Equipment Operations"
                satisfactoryName="formData.safetyItems.forkliftOperations.satisfactory"
                improvementName="formData.safetyItems.forkliftOperations.improvement"
                notApplicableName="formData.safetyItems.forkliftOperations.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="20) Cranes -Tower, Mobile"
                satisfactoryName="formData.safetyItems.cranes.satisfactory"
                improvementName="formData.safetyItems.cranes.improvement"
                notApplicableName="formData.safetyItems.cranes.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="21) Rigging, Lifting & Equipment"
                satisfactoryName="formData.safetyItems.riggingEquipment.satisfactory"
                improvementName="formData.safetyItems.riggingEquipment.improvement"
                notApplicableName="formData.safetyItems.riggingEquipment.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="22) Confined Space"
                satisfactoryName="formData.safetyItems.confinedSpace.satisfactory"
                improvementName="formData.safetyItems.confinedSpace.improvement"
                notApplicableName="formData.safetyItems.confinedSpace.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="23) Public Protection"
                satisfactoryName="formData.safetyItems.publicProtection.satisfactory"
                improvementName="formData.safetyItems.publicProtection.improvement"
                notApplicableName="formData.safetyItems.publicProtection.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="24) Excavation/Trenching"
                satisfactoryName="formData.safetyItems.excavationTrenching.satisfactory"
                improvementName="formData.safetyItems.excavationTrenching.improvement"
                notApplicableName="formData.safetyItems.excavationTrenching.notApplicable"
                register={register}
                errors={errors}
              />

              <CheckboxTrioField
                label="25) Other"
                satisfactoryName="formData.safetyItems.other.satisfactory"
                improvementName="formData.safetyItems.other.improvement"
                notApplicableName="formData.safetyItems.other.notApplicable"
                register={register}
                errors={errors}
              />
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
                placeholder="Add any additional notes here"
              />
            </FormField>
          </div>

          {/* Corrective Actions Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Corrective Actions
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Item #
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date Corrected
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Corrective Action Taken
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                    <tr key={index}>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <input
                          {...register(
                            `formData.correctiveActions.${index}.itemNumber`
                          )}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        />
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <input
                          type="date"
                          {...register(
                            `formData.correctiveActions.${index}.dateCorrected`
                          )}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          {...register(
                            `formData.correctiveActions.${index}.actionTaken`
                          )}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  Generate PDF for this Jobsite Safety Inspection
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
