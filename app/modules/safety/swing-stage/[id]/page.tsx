"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  useForm,
  useWatch,
  useFieldArray,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { generatePDF } from "../../../../components/PdfUtilsSafety";
import { useFullNameFromDB } from "../../../../components/useFullNameFromDB";

// ---------------- Schema & Types ----------------

// Define checkbox item with Yes, No, N/A options
const checkboxItemSchema = z.object({
  yes: z.boolean().default(false),
  no: z.boolean().default(false),
  na: z.boolean().default(false),
  note: z.string().optional(),
});

const swingStageFormSchema = z.object({
  formName: z.string().default("Swing-Stage"),
  pdfName: z.string().default("SwingStage.pdf"),
  userName: z.string().min(1, "User name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  jobName: z.string().min(1, "Job name is required"),
  formData: z.object({
    jobNumber: z.string().optional(),
    jobsiteAddress: z.string().min(1, "Jobsite address is required"),
    date: z.string().min(1, "Date is required"),
    superintendent: z.string().min(1, "Superintendent name is required"),
    weather: z.string().min(1, "Weather conditions are required"),

    // General Checks
    generalChecks: z.object({
      damageToEquipment: checkboxItemSchema,
      equipmentOverloaded: checkboxItemSchema,
      competentPersonQualified: checkboxItemSchema,
      equipmentUsedCorrectly: checkboxItemSchema,
      communicationAvailable: checkboxItemSchema,
      connectionHardwareGood: checkboxItemSchema,
      unattendedPlatformsSecured: checkboxItemSchema,
      requiredLabelsPresent: checkboxItemSchema,
    }),

    // Rigging Equipment Checks
    riggingEquipment: z.object({
      structureSupportsLoads: checkboxItemSchema,
      riggingEquipmentDesigned: checkboxItemSchema,
      additionalWeldingSafety: checkboxItemSchema,
      davitsSocketsInstalled: checkboxItemSchema,
      counterweightsMatch: checkboxItemSchema,
      testedAnchorageSupports: checkboxItemSchema,
      weldsInGoodCondition: checkboxItemSchema,
      componentsUndamaged: checkboxItemSchema,
      steelPartsNoPenetRust: checkboxItemSchema,
    }),

    // Suspended Platform Checks
    suspendedPlatform: z.object({
      platformStirrupsInLine: checkboxItemSchema,
      liveLoadNotExceed: checkboxItemSchema,
      platformPropDesigned: checkboxItemSchema,
      componentsInGoodOrder: checkboxItemSchema,
      visibleWeldsGood: checkboxItemSchema,
      wireRopePropReeved: checkboxItemSchema,
      mountingHolesFree: checkboxItemSchema,
      hardwareGrade5: checkboxItemSchema,
      stirrupSheavesGood: checkboxItemSchema,
      platformFreeCorrosion1: checkboxItemSchema,
      deckFreeDebris: checkboxItemSchema,
      platformFreeCorrosion2: checkboxItemSchema,
      safeDistancePowerLines: checkboxItemSchema,
      weatherConditionsAcceptable: checkboxItemSchema,
      powerCompanyContacted: checkboxItemSchema,
    }),

    // Hoist, Wire Rope & Power Checks
    hoistWireRopePower: z.object({
      hoistsProperlySelected: checkboxItemSchema,
      manufacturerInstructions: checkboxItemSchema,
      dailyTestsPerformed: checkboxItemSchema,
      hoistsProperWorking: checkboxItemSchema,
      cableConnections: checkboxItemSchema,
      powerSupplyAdequate: checkboxItemSchema,
      wireRopeInspected: checkboxItemSchema,
      wireRopeLength: checkboxItemSchema,
      emergencyStopWorks: checkboxItemSchema,
      controlledDescentTest: checkboxItemSchema,
    }),

    // Fall Protection System Checks
    fallProtectionSystem: z.object({
      workersUseFallArrest: checkboxItemSchema,
      ropeGrabInstalled: checkboxItemSchema,
      shockAbsorbingLanyard: checkboxItemSchema,
      fullBodyHarness: checkboxItemSchema,
      verticalLifeline: checkboxItemSchema,
      fallArrestUnguardedAreas: checkboxItemSchema,
      emergencyRescuePlan: checkboxItemSchema,
    }),

    // Comments/Action Items
    commentItems: z
      .array(
        z.object({
          comment: z.string().optional(),
        })
      )
      .default([{}, {}, {}, {}, {}]), // Default to 5 empty comment rows

    generatePDF: z.boolean().default(false),
  }),
});

type SwingStageForm = z.infer<typeof swingStageFormSchema>;

type Job = {
  id: number;
  name: string;
  jobNumber: string;
  status: string;
};

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

interface CheckboxGroupProps {
  label: string;
  yesName: string;
  noName: string;
  naName: string;
  noteName?: string;
  register: any;
  errors?: any;
  showNote?: boolean;
}

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

const CheckboxGroup = ({
  label,
  yesName,
  noName,
  naName,
  noteName,
  register,
  errors,
  showNote = false,
}: CheckboxGroupProps) => {
  // Extract the base path for the checkbox group
  const basePath = yesName.substring(0, yesName.lastIndexOf("."));

  // Get the setValue function from useForm context
  const { setValue, watch } = useFormContext();

  // Watch the current values
  const yesValue = watch(yesName);
  const noValue = watch(noName);
  const naValue = watch(naName);

  // Handle radio-like behavior when Yes is clicked
  const handleYesClick = () => {
    setValue(yesName, true);
    setValue(noName, false);
    setValue(naName, false);
  };

  // Handle radio-like behavior when No is clicked
  const handleNoClick = () => {
    setValue(yesName, false);
    setValue(noName, true);
    setValue(naName, false);
  };

  // Handle radio-like behavior when N/A is clicked
  const handleNaClick = () => {
    setValue(yesName, false);
    setValue(noName, false);
    setValue(naName, true);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center mb-2 py-1 border-b border-gray-100">
      <div className="col-span-6 pr-2">{label}</div>
      <div className="col-span-1 flex items-center justify-center">
        <input
          type="checkbox"
          id={yesName}
          {...register(yesName)}
          checked={yesValue}
          onChange={handleYesClick}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label htmlFor={yesName} className="ml-1 text-xs text-gray-700">
          Yes
        </label>
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <input
          type="checkbox"
          id={noName}
          {...register(noName)}
          checked={noValue}
          onChange={handleNoClick}
          className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
        />
        <label htmlFor={noName} className="ml-1 text-xs text-gray-700">
          No
        </label>
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <input
          type="checkbox"
          id={naName}
          {...register(naName)}
          checked={naValue}
          onChange={handleNaClick}
          className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
        />
        <label htmlFor={naName} className="ml-1 text-xs text-gray-700">
          N/A
        </label>
      </div>
      {showNote && noteName && (
        <div className="col-span-3">
          <input
            type="text"
            {...register(noteName)}
            placeholder="Note"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
          />
        </div>
      )}
    </div>
  );
};

// ---------------- Main Component ----------------

export default function Page() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<SwingStageForm>({
    resolver: zodResolver(swingStageFormSchema),
    defaultValues: {
      formName: "Swing-Stage",
      pdfName: "SwingStage.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "",
      jobName: "",
      formData: {
        jobNumber: "",
        jobsiteAddress: "",
        date: new Date().toISOString().split("T")[0],
        superintendent: "",
        weather: "",

        generalChecks: {
          damageToEquipment: { yes: false, no: false, na: false, note: "" },
          equipmentOverloaded: { yes: false, no: false, na: false, note: "" },
          competentPersonQualified: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          equipmentUsedCorrectly: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          communicationAvailable: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          connectionHardwareGood: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          unattendedPlatformsSecured: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          requiredLabelsPresent: { yes: false, no: false, na: false, note: "" },
        },

        riggingEquipment: {
          structureSupportsLoads: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          riggingEquipmentDesigned: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          additionalWeldingSafety: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          davitsSocketsInstalled: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          counterweightsMatch: { yes: false, no: false, na: false, note: "" },
          testedAnchorageSupports: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          weldsInGoodCondition: { yes: false, no: false, na: false, note: "" },
          componentsUndamaged: { yes: false, no: false, na: false, note: "" },
          steelPartsNoPenetRust: { yes: false, no: false, na: false, note: "" },
        },

        suspendedPlatform: {
          platformStirrupsInLine: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          liveLoadNotExceed: { yes: false, no: false, na: false, note: "" },
          platformPropDesigned: { yes: false, no: false, na: false, note: "" },
          componentsInGoodOrder: { yes: false, no: false, na: false, note: "" },
          visibleWeldsGood: { yes: false, no: false, na: false, note: "" },
          wireRopePropReeved: { yes: false, no: false, na: false, note: "" },
          mountingHolesFree: { yes: false, no: false, na: false, note: "" },
          hardwareGrade5: { yes: false, no: false, na: false, note: "" },
          stirrupSheavesGood: { yes: false, no: false, na: false, note: "" },
          platformFreeCorrosion1: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          deckFreeDebris: { yes: false, no: false, na: false, note: "" },
          platformFreeCorrosion2: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          safeDistancePowerLines: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          weatherConditionsAcceptable: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          powerCompanyContacted: { yes: false, no: false, na: false, note: "" },
        },

        hoistWireRopePower: {
          hoistsProperlySelected: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          manufacturerInstructions: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          dailyTestsPerformed: { yes: false, no: false, na: false, note: "" },
          hoistsProperWorking: { yes: false, no: false, na: false, note: "" },
          cableConnections: { yes: false, no: false, na: false, note: "" },
          powerSupplyAdequate: { yes: false, no: false, na: false, note: "" },
          wireRopeInspected: { yes: false, no: false, na: false, note: "" },
          wireRopeLength: { yes: false, no: false, na: false, note: "" },
          emergencyStopWorks: { yes: false, no: false, na: false, note: "" },
          controlledDescentTest: { yes: false, no: false, na: false, note: "" },
        },

        fallProtectionSystem: {
          workersUseFallArrest: { yes: false, no: false, na: false, note: "" },
          ropeGrabInstalled: { yes: false, no: false, na: false, note: "" },
          shockAbsorbingLanyard: { yes: false, no: false, na: false, note: "" },
          fullBodyHarness: { yes: false, no: false, na: false, note: "" },
          verticalLifeline: { yes: false, no: false, na: false, note: "" },
          fallArrestUnguardedAreas: {
            yes: false,
            no: false,
            na: false,
            note: "",
          },
          emergencyRescuePlan: { yes: false, no: false, na: false, note: "" },
        },

        commentItems: [{}, {}, {}, {}, {}],
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

  // Field array for comments
  const { fields, append, remove } = useFieldArray({
    control,
    name: "formData.commentItems",
  });

  // ---------------- Debounced Auto-Save ----------------

  // Watch form values so we can auto-save drafts for existing records
  const watchedValues = useWatch({ control });

  const saveDraft = useCallback(
    async (data: SwingStageForm) => {
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
  }, [id, loadJobs, loadSafetyForm]);

  // ---------------- Form Submission ----------------

  const onSubmit = async (formData: SwingStageForm) => {
    try {
      console.log("Saving with data:", formData);
      const isNewRecord = !id || id === "new";
      const method = isNewRecord ? "POST" : "PUT";
      const url = isNewRecord ? `/api/safety` : `/api/safety/${id}`;

      const payload = {
        ...formData,
        jobName: formData.jobName || "",
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
          submissionDate: new Date(),
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
          ? "Edit Swing-Stage Inspection"
          : "New Swing-Stage Inspection"}
      </h1>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Basic Information
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
                label="Job Number"
                error={errors.formData?.jobNumber?.message}
              >
                <input
                  {...register("formData.jobNumber")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  readOnly={true}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                label="Jobsite Address"
                error={errors.formData?.jobsiteAddress?.message}
                required
              >
                <input
                  {...register("formData.jobsiteAddress")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Date"
                error={errors.formData?.date?.message}
                required
              >
                <input
                  type="date"
                  {...register("formData.date")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                required
              >
                <input
                  {...register("formData.weather")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>
          </div>

          {/* Notice Section */}
          <div className="bg-yellow-50 p-4 rounded-md mb-6 border border-yellow-200">
            <p className="text-gray-700">
              Before each work shift and after any occurrence that could affect
              the structural integrity, a competent person must inspect the
              suspended scaffold and components for visible defects.
            </p>
            <p className="text-gray-700 mt-2">
              If you check any boxes under the "NO" column, or are in doubt
              about any item, you must immediately contact your supervisor or
              supplier. Tag the suspended scaffold "DO NOT USE" until the
              concern is corrected.
            </p>
          </div>

          {/* General Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">General</h2>

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center py-2 bg-blue-100">
                <div className="col-span-6 pl-2 font-semibold">Item</div>
                <div className="col-span-1 text-center font-semibold">Yes</div>
                <div className="col-span-1 text-center font-semibold">No</div>
                <div className="col-span-1 text-center font-semibold">N/A</div>
                <div className="col-span-3 text-center font-semibold hidden">
                  Note
                </div>
              </div>

              <div className="p-2">
                <CheckboxGroup
                  label="Any Damage to Equipment or altered in any way?"
                  yesName="formData.generalChecks.damageToEquipment.yes"
                  noName="formData.generalChecks.damageToEquipment.no"
                  naName="formData.generalChecks.damageToEquipment.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Equipment Overloaded?"
                  yesName="formData.generalChecks.equipmentOverloaded.yes"
                  noName="formData.generalChecks.equipmentOverloaded.no"
                  naName="formData.generalChecks.equipmentOverloaded.na"
                  register={register}
                />

                <CheckboxGroup
                  label="A competent person qualified in the use of suspended scaffolds supervises all the suspended scaffold systems that must be erected, altered, and dismantled."
                  yesName="formData.generalChecks.competentPersonQualified.yes"
                  noName="formData.generalChecks.competentPersonQualified.no"
                  naName="formData.generalChecks.competentPersonQualified.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Equipment is not used for any purposes other than for what it was intended."
                  yesName="formData.generalChecks.equipmentUsedCorrectly.yes"
                  noName="formData.generalChecks.equipmentUsedCorrectly.no"
                  naName="formData.generalChecks.equipmentUsedCorrectly.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Communication for workers on platform in available."
                  yesName="formData.generalChecks.communicationAvailable.yes"
                  noName="formData.generalChecks.communicationAvailable.no"
                  naName="formData.generalChecks.communicationAvailable.na"
                  register={register}
                />

                <CheckboxGroup
                  label="All connection hardware is in good working condition with properly installed locking devices."
                  yesName="formData.generalChecks.connectionHardwareGood.yes"
                  noName="formData.generalChecks.connectionHardwareGood.no"
                  naName="formData.generalChecks.connectionHardwareGood.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Unattended platforms are secured and power is disconnected to prevent unauthorized use."
                  yesName="formData.generalChecks.unattendedPlatformsSecured.yes"
                  noName="formData.generalChecks.unattendedPlatformsSecured.no"
                  naName="formData.generalChecks.unattendedPlatformsSecured.na"
                  register={register}
                />

                <CheckboxGroup
                  label="All required labels are present and clearly legible."
                  yesName="formData.generalChecks.requiredLabelsPresent.yes"
                  noName="formData.generalChecks.requiredLabelsPresent.no"
                  naName="formData.generalChecks.requiredLabelsPresent.na"
                  register={register}
                />
              </div>
            </div>
          </div>

          {/* Rigging Equipment Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Rigging Equipment
            </h2>

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center py-2 bg-blue-100">
                <div className="col-span-6 pl-2 font-semibold">Item</div>
                <div className="col-span-1 text-center font-semibold">Yes</div>
                <div className="col-span-1 text-center font-semibold">No</div>
                <div className="col-span-1 text-center font-semibold">N/A</div>
                <div className="col-span-3 text-center font-semibold hidden">
                  Note
                </div>
              </div>

              <div className="p-2">
                <CheckboxGroup
                  label="The structure is able to support the loads imposed by the rigging equipment."
                  yesName="formData.riggingEquipment.structureSupportsLoads.yes"
                  noName="formData.riggingEquipment.structureSupportsLoads.no"
                  naName="formData.riggingEquipment.structureSupportsLoads.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The rigging equipment is properly designed for the application and has been correctly assembled and installed per the manufacturer's instructions."
                  yesName="formData.riggingEquipment.riggingEquipmentDesigned.yes"
                  noName="formData.riggingEquipment.riggingEquipmentDesigned.no"
                  naName="formData.riggingEquipment.riggingEquipmentDesigned.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Additional safety precautions are taken when welding from a suspended scaffold."
                  yesName="formData.riggingEquipment.additionalWeldingSafety.yes"
                  noName="formData.riggingEquipment.additionalWeldingSafety.no"
                  naName="formData.riggingEquipment.additionalWeldingSafety.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Davits, sockets, or other permanent equipment are erected and installed correctly, and inspections are current."
                  yesName="formData.riggingEquipment.davitsSocketsInstalled.yes"
                  noName="formData.riggingEquipment.davitsSocketsInstalled.no"
                  naName="formData.riggingEquipment.davitsSocketsInstalled.na"
                  register={register}
                />

                <CheckboxGroup
                  label="When using counterweighted outrigger beams, the number of counterweights match the outreach and hoist rated load capacity per the counterweight formula."
                  yesName="formData.riggingEquipment.counterweightsMatch.yes"
                  noName="formData.riggingEquipment.counterweightsMatch.no"
                  naName="formData.riggingEquipment.counterweightsMatch.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Tested anchorage supports used in lieu of counterweights will support all applied loads."
                  yesName="formData.riggingEquipment.testedAnchorageSupports.yes"
                  noName="formData.riggingEquipment.testedAnchorageSupports.no"
                  naName="formData.riggingEquipment.testedAnchorageSupports.na"
                  register={register}
                />

                <CheckboxGroup
                  label="All welds are in good condition."
                  yesName="formData.riggingEquipment.weldsInGoodCondition.yes"
                  noName="formData.riggingEquipment.weldsInGoodCondition.no"
                  naName="formData.riggingEquipment.weldsInGoodCondition.na"
                  register={register}
                />

                <CheckboxGroup
                  label="All components are undamaged and are in good working condition. All mounting holes are free from deformation and/or cracks."
                  yesName="formData.riggingEquipment.componentsUndamaged.yes"
                  noName="formData.riggingEquipment.componentsUndamaged.no"
                  naName="formData.riggingEquipment.componentsUndamaged.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Steel parts do not have penetrating rust."
                  yesName="formData.riggingEquipment.steelPartsNoPenetRust.yes"
                  noName="formData.riggingEquipment.steelPartsNoPenetRust.no"
                  naName="formData.riggingEquipment.steelPartsNoPenetRust.na"
                  register={register}
                />
              </div>
            </div>
          </div>

          {/* Suspended Platform Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Suspended Platform
            </h2>

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center py-2 bg-blue-100">
                <div className="col-span-6 pl-2 font-semibold">Item</div>
                <div className="col-span-1 text-center font-semibold">Yes</div>
                <div className="col-span-1 text-center font-semibold">No</div>
                <div className="col-span-1 text-center font-semibold">N/A</div>
                <div className="col-span-3 text-center font-semibold hidden">
                  Note
                </div>
              </div>

              <div className="p-2">
                <CheckboxGroup
                  label="The platform stirrups are in line with the rigging equipment."
                  yesName="formData.suspendedPlatform.platformStirrupsInLine.yes"
                  noName="formData.suspendedPlatform.platformStirrupsInLine.no"
                  naName="formData.suspendedPlatform.platformStirrupsInLine.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The live load does not exceed the platform rated load capacity."
                  yesName="formData.suspendedPlatform.liveLoadNotExceed.yes"
                  noName="formData.suspendedPlatform.liveLoadNotExceed.no"
                  naName="formData.suspendedPlatform.liveLoadNotExceed.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The platform is properly designed for the application and has been correctly assembled per the manufacturer's instructions or design drawings."
                  yesName="formData.suspendedPlatform.platformPropDesigned.yes"
                  noName="formData.suspendedPlatform.platformPropDesigned.no"
                  naName="formData.suspendedPlatform.platformPropDesigned.na"
                  register={register}
                />

                <CheckboxGroup
                  label="All components are in good order, and there are no missing, bent or damaged parts."
                  yesName="formData.suspendedPlatform.componentsInGoodOrder.yes"
                  noName="formData.suspendedPlatform.componentsInGoodOrder.no"
                  naName="formData.suspendedPlatform.componentsInGoodOrder.na"
                  register={register}
                />

                <CheckboxGroup
                  label="All visible welds are in good condition and not visibly cracked, torn, or excessively corroded."
                  yesName="formData.suspendedPlatform.visibleWeldsGood.yes"
                  noName="formData.suspendedPlatform.visibleWeldsGood.no"
                  naName="formData.suspendedPlatform.visibleWeldsGood.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The wire rope is properly reeved through the sheaves."
                  yesName="formData.suspendedPlatform.wireRopePropReeved.yes"
                  noName="formData.suspendedPlatform.wireRopePropReeved.no"
                  naName="formData.suspendedPlatform.wireRopePropReeved.na"
                  register={register}
                />

                <CheckboxGroup
                  label="All mounting holes are free from deformation."
                  yesName="formData.suspendedPlatform.mountingHolesFree.yes"
                  noName="formData.suspendedPlatform.mountingHolesFree.no"
                  naName="formData.suspendedPlatform.mountingHolesFree.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The hardware is grade 5 or better and in good condition; the lock nuts are not worn."
                  yesName="formData.suspendedPlatform.hardwareGrade5.yes"
                  noName="formData.suspendedPlatform.hardwareGrade5.no"
                  naName="formData.suspendedPlatform.hardwareGrade5.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The stirrup sheaves, bearings, and inlet wire rope guides are in good condition."
                  yesName="formData.suspendedPlatform.stirrupSheavesGood.yes"
                  noName="formData.suspendedPlatform.stirrupSheavesGood.no"
                  naName="formData.suspendedPlatform.stirrupSheavesGood.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The platform is free from chemical corrosion and excessive abrasion damage."
                  yesName="formData.suspendedPlatform.platformFreeCorrosion1.yes"
                  noName="formData.suspendedPlatform.platformFreeCorrosion1.no"
                  naName="formData.suspendedPlatform.platformFreeCorrosion1.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The deck is free from excessive debris that could cause a slipping hazard or affect the load capacity and/or proper functioning/installation of the component(s)."
                  yesName="formData.suspendedPlatform.deckFreeDebris.yes"
                  noName="formData.suspendedPlatform.deckFreeDebris.no"
                  naName="formData.suspendedPlatform.deckFreeDebris.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The platform is free from chemical corrosion and excessive abrasion damage."
                  yesName="formData.suspendedPlatform.platformFreeCorrosion2.yes"
                  noName="formData.suspendedPlatform.platformFreeCorrosion2.no"
                  naName="formData.suspendedPlatform.platformFreeCorrosion2.na"
                  register={register}
                />

                <CheckboxGroup
                  label="When working near live power lines, a safe distance must be maintained. Check with the local authority when working near exposed power lines. A minimum clearance of 10 feet is required between scaffold equipment and power lines."
                  yesName="formData.suspendedPlatform.safeDistancePowerLines.yes"
                  noName="formData.suspendedPlatform.safeDistancePowerLines.no"
                  naName="formData.suspendedPlatform.safeDistancePowerLines.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Weather conditions are acceptable for safe use of the platform. Wind speeds do not exceed 25 mph for a multi-point suspended platform OR 20 mph for a single-point work cage or bosun's chair."
                  yesName="formData.suspendedPlatform.weatherConditionsAcceptable.yes"
                  noName="formData.suspendedPlatform.weatherConditionsAcceptable.no"
                  naName="formData.suspendedPlatform.weatherConditionsAcceptable.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Your local power company has been contacted regarding problems or issues relating to any hazards."
                  yesName="formData.suspendedPlatform.powerCompanyContacted.yes"
                  noName="formData.suspendedPlatform.powerCompanyContacted.no"
                  naName="formData.suspendedPlatform.powerCompanyContacted.na"
                  register={register}
                />
              </div>
            </div>
          </div>

          {/* Hoist, Wire Rope & Power Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Hoist, Wire Rope & Power
            </h2>

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center py-2 bg-blue-100">
                <div className="col-span-6 pl-2 font-semibold">Item</div>
                <div className="col-span-1 text-center font-semibold">Yes</div>
                <div className="col-span-1 text-center font-semibold">No</div>
                <div className="col-span-1 text-center font-semibold">N/A</div>
                <div className="col-span-3 text-center font-semibold hidden">
                  Note
                </div>
              </div>

              <div className="p-2">
                <CheckboxGroup
                  label="The hoists are properly selected for the application and have been correctly installed per the manufacturer's instructions."
                  yesName="formData.hoistWireRopePower.hoistsProperlySelected.yes"
                  noName="formData.hoistWireRopePower.hoistsProperlySelected.no"
                  naName="formData.hoistWireRopePower.hoistsProperlySelected.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The manufacturer's operating instructions have been read, understood, and are available for reference."
                  yesName="formData.hoistWireRopePower.manufacturerInstructions.yes"
                  noName="formData.hoistWireRopePower.manufacturerInstructions.no"
                  naName="formData.hoistWireRopePower.manufacturerInstructions.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The daily tests have been performed according to the hoist operating manual."
                  yesName="formData.hoistWireRopePower.dailyTestsPerformed.yes"
                  noName="formData.hoistWireRopePower.dailyTestsPerformed.no"
                  naName="formData.hoistWireRopePower.dailyTestsPerformed.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The hoists are in proper working order."
                  yesName="formData.hoistWireRopePower.hoistsProperWorking.yes"
                  noName="formData.hoistWireRopePower.hoistsProperWorking.no"
                  naName="formData.hoistWireRopePower.hoistsProperWorking.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The electric cable and/or air hose connections are secured, have been inspected, and are safe for use."
                  yesName="formData.hoistWireRopePower.cableConnections.yes"
                  noName="formData.hoistWireRopePower.cableConnections.no"
                  naName="formData.hoistWireRopePower.cableConnections.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The power supply is adequate for the number and type of hoists being used."
                  yesName="formData.hoistWireRopePower.powerSupplyAdequate.yes"
                  noName="formData.hoistWireRopePower.powerSupplyAdequate.no"
                  naName="formData.hoistWireRopePower.powerSupplyAdequate.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The wire rope has been inspected and is in good working condition."
                  yesName="formData.hoistWireRopePower.wireRopeInspected.yes"
                  noName="formData.hoistWireRopePower.wireRopeInspected.no"
                  naName="formData.hoistWireRopePower.wireRopeInspected.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The length of the wire rope is appropriate for the specific job and is properly attached to the support equipment. All fittings are checked under load."
                  yesName="formData.hoistWireRopePower.wireRopeLength.yes"
                  noName="formData.hoistWireRopePower.wireRopeLength.no"
                  naName="formData.hoistWireRopePower.wireRopeLength.na"
                  register={register}
                />

                <CheckboxGroup
                  label="The emergency stop and secondary brake operate correctly."
                  yesName="formData.hoistWireRopePower.emergencyStopWorks.yes"
                  noName="formData.hoistWireRopePower.emergencyStopWorks.no"
                  naName="formData.hoistWireRopePower.emergencyStopWorks.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Controlled descent is tested and is working properly."
                  yesName="formData.hoistWireRopePower.controlledDescentTest.yes"
                  noName="formData.hoistWireRopePower.controlledDescentTest.no"
                  naName="formData.hoistWireRopePower.controlledDescentTest.na"
                  register={register}
                />
              </div>
            </div>
          </div>

          {/* Fall Protection System Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Fall Protection System
            </h2>

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center py-2 bg-blue-100">
                <div className="col-span-6 pl-2 font-semibold">Item</div>
                <div className="col-span-1 text-center font-semibold">Yes</div>
                <div className="col-span-1 text-center font-semibold">No</div>
                <div className="col-span-1 text-center font-semibold">N/A</div>
                <div className="col-span-3 text-center font-semibold hidden">
                  Note
                </div>
              </div>

              <div className="p-2">
                <CheckboxGroup
                  label="Workers use proper fall arrest equipment at all times."
                  yesName="formData.fallProtectionSystem.workersUseFallArrest.yes"
                  noName="formData.fallProtectionSystem.workersUseFallArrest.no"
                  naName="formData.fallProtectionSystem.workersUseFallArrest.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Each rope grab is correctly installed and operating properly, and the size is compatible with the lifeline."
                  yesName="formData.fallProtectionSystem.ropeGrabInstalled.yes"
                  noName="formData.fallProtectionSystem.ropeGrabInstalled.no"
                  naName="formData.fallProtectionSystem.ropeGrabInstalled.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Each shock-absorbing lanyard is inspected and is installed correctly for safe use."
                  yesName="formData.fallProtectionSystem.shockAbsorbingLanyard.yes"
                  noName="formData.fallProtectionSystem.shockAbsorbingLanyard.no"
                  naName="formData.fallProtectionSystem.shockAbsorbingLanyard.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Each full body harness is properly inspected and adjusted."
                  yesName="formData.fallProtectionSystem.fullBodyHarness.yes"
                  noName="formData.fallProtectionSystem.fullBodyHarness.no"
                  naName="formData.fallProtectionSystem.fullBodyHarness.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Each vertical lifeline has been inspected for safe use and is correctly installed with edge protection to an independent anchor point capable of holding a 5,000 pound ultimate load."
                  yesName="formData.fallProtectionSystem.verticalLifeline.yes"
                  noName="formData.fallProtectionSystem.verticalLifeline.no"
                  naName="formData.fallProtectionSystem.verticalLifeline.na"
                  register={register}
                />

                <CheckboxGroup
                  label="Fall arrest equipment will be used around unguarded areas where a fall of 6' or more exists."
                  yesName="formData.fallProtectionSystem.fallArrestUnguardedAreas.yes"
                  noName="formData.fallProtectionSystem.fallArrestUnguardedAreas.no"
                  naName="formData.fallProtectionSystem.fallArrestUnguardedAreas.na"
                  register={register}
                />

                <CheckboxGroup
                  label="An emergency rescue plan has been developed and reviewed."
                  yesName="formData.fallProtectionSystem.emergencyRescuePlan.yes"
                  noName="formData.fallProtectionSystem.emergencyRescuePlan.no"
                  naName="formData.fallProtectionSystem.emergencyRescuePlan.na"
                  register={register}
                />
              </div>
            </div>
          </div>

          {/* Safety Notice */}
          <div className="bg-yellow-50 p-4 rounded-md mb-6 border border-yellow-200">
            <p className="text-gray-700 font-medium mb-2">
              Note: No worker shall enter a suspended platform, work cage until
              they are TIED OFF in a safe manner. They must not disconnect until
              they have safely exited the platform.
            </p>
            <p className="text-gray-700">
              Report any problems found to supervisor. ALWAYS lock/tag-out
              unsafe equipment.
            </p>
          </div>

          {/* Comments/Action Items */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Comments/Action Items
            </h2>

            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="p-2 text-left w-full">
                      Comments/Action Items
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr
                      key={field.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="p-2 border">
                        <input
                          {...register(
                            `formData.commentItems.${index}.comment`
                          )}
                          className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-2">
              <button
                type="button"
                onClick={() => append({})}
                className="text-indigo-600 hover:text-indigo-800"
              >
                + Add another comment
              </button>
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
                  Generate PDF for this Swing-Stage Inspection
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
