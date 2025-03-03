// components/MEWPInspectionDisplay.tsx
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

// Define checkbox item with OK, No, N/A options
const checkboxItemSchema = z.object({
  ok: z.boolean().default(false),
  no: z.boolean().default(false),
  na: z.boolean().default(false),
  note: z.string().optional(),
});

// MEWP Type checkboxes
const mewpTypeSchema = z.object({
  scissorLift: z.boolean().default(false),
  personnelLift: z.boolean().default(false),
  aerialLift: z.boolean().default(false),
  telescopingLift: z.boolean().default(false),
  boomLift: z.boolean().default(false),
  articulatingLift: z.boolean().default(false),
});

const mewpFormSchema = z.object({
  formName: z
    .string()
    .default("Mobile Elevating Work Platform (MEWP) Pre-Use Inspection"),
  pdfName: z.string().default("MEWP.pdf"),
  userName: z.string().min(1, "User name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  jobName: z.string().default(""),
  jobNumber: z.string().default(""),
  formData: z.object({
    jobName: z.string().min(1, "Job name is required"),
    mewpMakeModel: z.string().min(1, "MEWP make/model is required"),
    mewpType: mewpTypeSchema,
    mewpId: z.string().min(1, "MEWP ID is required"),
    hourMeterReading: z.string().optional(),
    inspectionConductedBy: z.string().min(1, "Inspector name is required"),
    inspectionDate: z.string().min(1, "Inspection date is required"),

    // Power Off Checks
    powerOffChecks: z.object({
      wheelsAndTires: checkboxItemSchema,
      lightsStrobes: checkboxItemSchema,
      mirrorsVisibilityAids: checkboxItemSchema,
      engineCompartmentBeltsHoses: checkboxItemSchema,
      engineCompartmentCablesWires: checkboxItemSchema,
      engineCompartmentDebris: checkboxItemSchema,
      batteryTerminalsTight: checkboxItemSchema,
      batteryCleanDrySecure: checkboxItemSchema,
      hydraulicsCylindersRods: checkboxItemSchema,
      hydraulicsHosesLinesFittings: checkboxItemSchema,
      engineOil: checkboxItemSchema,
      engineCoolant: checkboxItemSchema,
      hydraulicOil: checkboxItemSchema,
      fuelBattery: checkboxItemSchema,
      dataCapacityPlate: checkboxItemSchema,
      counterweightBolts: checkboxItemSchema,
      coverPanels: checkboxItemSchema,
      boomValleyUnderPlatform: checkboxItemSchema,
      accessoryPlugsCables: checkboxItemSchema,
      boomLiftArmsCondition: checkboxItemSchema,
      powerTrackLinesHoses: checkboxItemSchema,
      safetyPropFunctional: checkboxItemSchema,
      platformGuardrailsEtc: checkboxItemSchema,
      storageCompartmentManuals: checkboxItemSchema,
      controlMarkingsVisible: checkboxItemSchema,
      other1: checkboxItemSchema,
      other2: checkboxItemSchema,
      other3: checkboxItemSchema,
    }),

    // Power On Checks
    powerOnChecks: z.object({
      unitStartsRunsProperly: checkboxItemSchema,
      instrumentsGauges: checkboxItemSchema,
      warningLightsAlarms: checkboxItemSchema,
      fuelChargeLevel: checkboxItemSchema,
      hornWarningDevices: checkboxItemSchema,
      boomJibLiftArms: checkboxItemSchema,
      turretRotate: checkboxItemSchema,
      driveForwardReverse: checkboxItemSchema,
      steerLeftRight: checkboxItemSchema,
      platformTiltRotateExtend: checkboxItemSchema,
      stabilityEnhancingDevices: checkboxItemSchema,
      functionEnableDevices: checkboxItemSchema,
      emergencyAuxiliaryControls: checkboxItemSchema,
      safetyInterlocks: checkboxItemSchema,
      brakingStopsHolds: checkboxItemSchema,
      otherPowerOn: checkboxItemSchema,
    }),

    // General
    generalChecks: z.object({
      mfrOperatingManual: checkboxItemSchema,
      safetyDecalsWarnings: checkboxItemSchema,
      miscPartsLooseMissingBroken: checkboxItemSchema,
    }),

    // Work Area Inspection
    workAreaChecks: z.object({
      dropOffsHoles: checkboxItemSchema,
      bumpsFloorObstructions: checkboxItemSchema,
      debris: checkboxItemSchema,
      overheadObstructions: checkboxItemSchema,
      energizedPowerLines: checkboxItemSchema,
      hazardousLocations: checkboxItemSchema,
      groundSurfaceSupport: checkboxItemSchema,
      pedestrianVehicleTraffic: checkboxItemSchema,
      windWeatherConditions: checkboxItemSchema,
      otherPossibleHazards: checkboxItemSchema,
    }),

    // Comments/Action Items
    commentItems: z
      .array(
        z.object({
          itemNumber: z.string().optional(),
          comment: z.string().optional(),
        })
      )
      .default([{}, {}, {}, {}]), // Default to 4 empty comment rows

    generatePDF: z.boolean().default(false),
  }),
});

type MEWPForm = z.infer<typeof mewpFormSchema>;

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

interface CheckboxGroupProps {
  label: string;
  okName: string;
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
  okName,
  noName,
  naName,
  noteName,
  register,
  errors,
  showNote = true,
}: CheckboxGroupProps) => {
  // Extract the base path for the checkbox group (e.g., "formData.powerOffChecks.wheelsAndTires")
  const basePath = okName.substring(0, okName.lastIndexOf("."));

  // Get the setValue function from useForm context
  const { setValue, watch } = useFormContext();

  // Watch the current values
  const okValue = watch(okName);
  const noValue = watch(noName);
  const naValue = watch(naName);

  // Handle radio-like behavior when OK is clicked
  const handleOkClick = () => {
    setValue(okName, true);
    setValue(noName, false);
    setValue(naName, false);
  };

  // Handle radio-like behavior when No is clicked
  const handleNoClick = () => {
    setValue(okName, false);
    setValue(noName, true);
    setValue(naName, false);
  };

  // Handle radio-like behavior when N/A is clicked
  const handleNaClick = () => {
    setValue(okName, false);
    setValue(noName, false);
    setValue(naName, true);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center mb-2 py-1 border-b border-gray-100">
      <div className="col-span-5 pr-2">{label}</div>
      <div className="col-span-1 flex items-center justify-center">
        <input
          type="checkbox"
          id={okName}
          {...register(okName)}
          checked={okValue}
          onChange={handleOkClick}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label htmlFor={okName} className="ml-1 text-xs text-gray-700">
          OK
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
        <div className="col-span-4">
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

export default function MEWPFormPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<MEWPForm>({
    resolver: zodResolver(mewpFormSchema),
    defaultValues: {
      formName: "MEWP",
      pdfName: "MEWP.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "Stephen Watts",
      jobName: "",
      jobNumber: "",
      formData: {
        jobName: "",
        mewpMakeModel: "",
        mewpType: {
          scissorLift: false,
          personnelLift: false,
          aerialLift: false,
          telescopingLift: false,
          boomLift: false,
          articulatingLift: false,
        },
        mewpId: "",
        hourMeterReading: "",
        inspectionConductedBy: fullName || "",
        inspectionDate: new Date().toISOString().split("T")[0],
        powerOffChecks: {
          wheelsAndTires: { ok: false, no: false, na: false, note: "" },
          lightsStrobes: { ok: false, no: false, na: false, note: "" },
          mirrorsVisibilityAids: { ok: false, no: false, na: false, note: "" },
          engineCompartmentBeltsHoses: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          engineCompartmentCablesWires: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          engineCompartmentDebris: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          batteryTerminalsTight: { ok: false, no: false, na: false, note: "" },
          batteryCleanDrySecure: { ok: false, no: false, na: false, note: "" },
          hydraulicsCylindersRods: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          hydraulicsHosesLinesFittings: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          engineOil: { ok: false, no: false, na: false, note: "" },
          engineCoolant: { ok: false, no: false, na: false, note: "" },
          hydraulicOil: { ok: false, no: false, na: false, note: "" },
          fuelBattery: { ok: false, no: false, na: false, note: "" },
          dataCapacityPlate: { ok: false, no: false, na: false, note: "" },
          counterweightBolts: { ok: false, no: false, na: false, note: "" },
          coverPanels: { ok: false, no: false, na: false, note: "" },
          boomValleyUnderPlatform: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          accessoryPlugsCables: { ok: false, no: false, na: false, note: "" },
          boomLiftArmsCondition: { ok: false, no: false, na: false, note: "" },
          powerTrackLinesHoses: { ok: false, no: false, na: false, note: "" },
          safetyPropFunctional: { ok: false, no: false, na: false, note: "" },
          platformGuardrailsEtc: { ok: false, no: false, na: false, note: "" },
          storageCompartmentManuals: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          controlMarkingsVisible: { ok: false, no: false, na: false, note: "" },
          other1: { ok: false, no: false, na: false, note: "" },
          other2: { ok: false, no: false, na: false, note: "" },
          other3: { ok: false, no: false, na: false, note: "" },
        },
        powerOnChecks: {
          unitStartsRunsProperly: { ok: false, no: false, na: false, note: "" },
          instrumentsGauges: { ok: false, no: false, na: false, note: "" },
          warningLightsAlarms: { ok: false, no: false, na: false, note: "" },
          fuelChargeLevel: { ok: false, no: false, na: false, note: "" },
          hornWarningDevices: { ok: false, no: false, na: false, note: "" },
          boomJibLiftArms: { ok: false, no: false, na: false, note: "" },
          turretRotate: { ok: false, no: false, na: false, note: "" },
          driveForwardReverse: { ok: false, no: false, na: false, note: "" },
          steerLeftRight: { ok: false, no: false, na: false, note: "" },
          platformTiltRotateExtend: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          stabilityEnhancingDevices: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          functionEnableDevices: { ok: false, no: false, na: false, note: "" },
          emergencyAuxiliaryControls: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          safetyInterlocks: { ok: false, no: false, na: false, note: "" },
          brakingStopsHolds: { ok: false, no: false, na: false, note: "" },
          otherPowerOn: { ok: false, no: false, na: false, note: "" },
        },
        generalChecks: {
          mfrOperatingManual: { ok: false, no: false, na: false, note: "" },
          safetyDecalsWarnings: { ok: false, no: false, na: false, note: "" },
          miscPartsLooseMissingBroken: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
        },
        workAreaChecks: {
          dropOffsHoles: { ok: false, no: false, na: false, note: "" },
          bumpsFloorObstructions: { ok: false, no: false, na: false, note: "" },
          debris: { ok: false, no: false, na: false, note: "" },
          overheadObstructions: { ok: false, no: false, na: false, note: "" },
          energizedPowerLines: { ok: false, no: false, na: false, note: "" },
          hazardousLocations: { ok: false, no: false, na: false, note: "" },
          groundSurfaceSupport: { ok: false, no: false, na: false, note: "" },
          pedestrianVehicleTraffic: {
            ok: false,
            no: false,
            na: false,
            note: "",
          },
          windWeatherConditions: { ok: false, no: false, na: false, note: "" },
          otherPossibleHazards: { ok: false, no: false, na: false, note: "" },
        },
        commentItems: [{}, {}, {}, {}],
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
    async (data: MEWPForm) => {
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

  // ---------------- API Loaders ----------------

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

  const onSubmit = async (formData: MEWPForm) => {
    try {
      console.log("Saving with data:", formData);
      const isNewRecord = !id || id === "new";
      const method = isNewRecord ? "POST" : "PUT";
      const url = isNewRecord ? `/api/safety` : `/api/safety/${id}`;

      const payload = {
        ...formData,
        jobName: formData.formData.jobName || "",
        jobNumber: formData.jobNumber || "",
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
          jobName: formData.formData.jobName,
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
        {id && id !== "new" ? "Edit MEWP Inspection" : "New MEWP Inspection"}
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
                error={errors.formData?.jobName?.message}
                required
              >
                <input
                  {...register("formData.jobName")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="MEWP Make/Model"
                error={errors.formData?.mewpMakeModel?.message}
                required
              >
                <input
                  {...register("formData.mewpMakeModel")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>

            <div className="mt-4">
              <FormField label="MEWP Type" error={undefined}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="scissorLift"
                      {...register("formData.mewpType.scissorLift")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="scissorLift"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Scissor Lift
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="personnelLift"
                      {...register("formData.mewpType.personnelLift")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="personnelLift"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Personnel Lift
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="aerialLift"
                      {...register("formData.mewpType.aerialLift")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="aerialLift"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Aerial Lift
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="telescopingLift"
                      {...register("formData.mewpType.telescopingLift")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="telescopingLift"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Telescoping Lift
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="boomLift"
                      {...register("formData.mewpType.boomLift")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="boomLift"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Boom Lift
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="articulatingLift"
                      {...register("formData.mewpType.articulatingLift")}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label
                      htmlFor="articulatingLift"
                      className="ml-2 block text-sm text-gray-700"
                    >
                      Articulating Lift
                    </label>
                  </div>
                </div>
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                label="MEWP ID"
                error={errors.formData?.mewpId?.message}
                required
              >
                <input
                  {...register("formData.mewpId")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Hour Meter Reading"
                error={errors.formData?.hourMeterReading?.message}
              >
                <input
                  {...register("formData.hourMeterReading")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <FormField
                label="Inspection Conducted By"
                error={errors.formData?.inspectionConductedBy?.message}
                required
              >
                <input
                  {...register("formData.inspectionConductedBy")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Date"
                error={errors.formData?.inspectionDate?.message}
                required
              >
                <input
                  type="date"
                  {...register("formData.inspectionDate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>
          </div>
          {/* Power Off Checks Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Power Off Checks
            </h2>

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center py-2 bg-blue-100">
                <div className="col-span-5 pl-2 font-semibold">Item</div>
                <div className="col-span-1 text-center font-semibold">OK</div>
                <div className="col-span-1 text-center font-semibold">No</div>
                <div className="col-span-1 text-center font-semibold">N/A</div>
                <div className="col-span-4 text-center font-semibold">Note</div>
              </div>

              <div className="p-2">
                <CheckboxGroup
                  label="1. Wheels and tires"
                  okName="formData.powerOffChecks.wheelsAndTires.ok"
                  noName="formData.powerOffChecks.wheelsAndTires.no"
                  naName="formData.powerOffChecks.wheelsAndTires.na"
                  noteName="formData.powerOffChecks.wheelsAndTires.note"
                  register={register}
                />

                <CheckboxGroup
                  label="2. Lights/strobes"
                  okName="formData.powerOffChecks.lightsStrobes.ok"
                  noName="formData.powerOffChecks.lightsStrobes.no"
                  naName="formData.powerOffChecks.lightsStrobes.na"
                  noteName="formData.powerOffChecks.lightsStrobes.note"
                  register={register}
                />

                <CheckboxGroup
                  label="3. Mirrors/visibility aids"
                  okName="formData.powerOffChecks.mirrorsVisibilityAids.ok"
                  noName="formData.powerOffChecks.mirrorsVisibilityAids.no"
                  naName="formData.powerOffChecks.mirrorsVisibilityAids.na"
                  noteName="formData.powerOffChecks.mirrorsVisibilityAids.note"
                  register={register}
                />

                <div className="pl-4 mt-2 mb-1 font-medium">
                  4. Engine/engine compartment:
                </div>

                <CheckboxGroup
                  label="a. Belts/hoses"
                  okName="formData.powerOffChecks.engineCompartmentBeltsHoses.ok"
                  noName="formData.powerOffChecks.engineCompartmentBeltsHoses.no"
                  naName="formData.powerOffChecks.engineCompartmentBeltsHoses.na"
                  noteName="formData.powerOffChecks.engineCompartmentBeltsHoses.note"
                  register={register}
                />

                <CheckboxGroup
                  label="b. Cables/wires"
                  okName="formData.powerOffChecks.engineCompartmentCablesWires.ok"
                  noName="formData.powerOffChecks.engineCompartmentCablesWires.no"
                  naName="formData.powerOffChecks.engineCompartmentCablesWires.na"
                  noteName="formData.powerOffChecks.engineCompartmentCablesWires.note"
                  register={register}
                />

                <CheckboxGroup
                  label="c. Debris"
                  okName="formData.powerOffChecks.engineCompartmentDebris.ok"
                  noName="formData.powerOffChecks.engineCompartmentDebris.no"
                  naName="formData.powerOffChecks.engineCompartmentDebris.na"
                  noteName="formData.powerOffChecks.engineCompartmentDebris.note"
                  register={register}
                />

                <div className="pl-4 mt-2 mb-1 font-medium">
                  5. Battery/batteries:
                </div>

                <CheckboxGroup
                  label="a. Terminals tight"
                  okName="formData.powerOffChecks.batteryTerminalsTight.ok"
                  noName="formData.powerOffChecks.batteryTerminalsTight.no"
                  naName="formData.powerOffChecks.batteryTerminalsTight.na"
                  noteName="formData.powerOffChecks.batteryTerminalsTight.note"
                  register={register}
                />

                <CheckboxGroup
                  label="b. Clean/dry/secure"
                  okName="formData.powerOffChecks.batteryCleanDrySecure.ok"
                  noName="formData.powerOffChecks.batteryCleanDrySecure.no"
                  naName="formData.powerOffChecks.batteryCleanDrySecure.na"
                  noteName="formData.powerOffChecks.batteryCleanDrySecure.note"
                  register={register}
                />

                <div className="pl-4 mt-2 mb-1 font-medium">6. Hydraulics:</div>

                <CheckboxGroup
                  label="a. Cylinders/rods"
                  okName="formData.powerOffChecks.hydraulicsCylindersRods.ok"
                  noName="formData.powerOffChecks.hydraulicsCylindersRods.no"
                  naName="formData.powerOffChecks.hydraulicsCylindersRods.na"
                  noteName="formData.powerOffChecks.hydraulicsCylindersRods.note"
                  register={register}
                />

                <CheckboxGroup
                  label="b. Hoses/lines/fittings"
                  okName="formData.powerOffChecks.hydraulicsHosesLinesFittings.ok"
                  noName="formData.powerOffChecks.hydraulicsHosesLinesFittings.no"
                  naName="formData.powerOffChecks.hydraulicsHosesLinesFittings.na"
                  noteName="formData.powerOffChecks.hydraulicsHosesLinesFittings.note"
                  register={register}
                />

                <div className="pl-4 mt-2 mb-1 font-medium">7. Fluids:</div>

                <CheckboxGroup
                  label="a. Engine oil (Level & Leaks)"
                  okName="formData.powerOffChecks.engineOil.ok"
                  noName="formData.powerOffChecks.engineOil.no"
                  naName="formData.powerOffChecks.engineOil.na"
                  noteName="formData.powerOffChecks.engineOil.note"
                  register={register}
                />

                <CheckboxGroup
                  label="b. Engine coolant (Level & Leaks)"
                  okName="formData.powerOffChecks.engineCoolant.ok"
                  noName="formData.powerOffChecks.engineCoolant.no"
                  naName="formData.powerOffChecks.engineCoolant.na"
                  noteName="formData.powerOffChecks.engineCoolant.note"
                  register={register}
                />

                <CheckboxGroup
                  label="c. Hydraulic oil (Level & Leaks)"
                  okName="formData.powerOffChecks.hydraulicOil.ok"
                  noName="formData.powerOffChecks.hydraulicOil.no"
                  naName="formData.powerOffChecks.hydraulicOil.na"
                  noteName="formData.powerOffChecks.hydraulicOil.note"
                  register={register}
                />

                <CheckboxGroup
                  label="d. Fuel/battery (Level & Leaks)"
                  okName="formData.powerOffChecks.fuelBattery.ok"
                  noName="formData.powerOffChecks.fuelBattery.no"
                  naName="formData.powerOffChecks.fuelBattery.na"
                  noteName="formData.powerOffChecks.fuelBattery.note"
                  register={register}
                />

                <CheckboxGroup
                  label="8. Data/capacity plate"
                  okName="formData.powerOffChecks.dataCapacityPlate.ok"
                  noName="formData.powerOffChecks.dataCapacityPlate.no"
                  naName="formData.powerOffChecks.dataCapacityPlate.na"
                  noteName="formData.powerOffChecks.dataCapacityPlate.note"
                  register={register}
                />

                <CheckboxGroup
                  label="9. Counterweight/Counterweight bolt(s)"
                  okName="formData.powerOffChecks.counterweightBolts.ok"
                  noName="formData.powerOffChecks.counterweightBolts.no"
                  naName="formData.powerOffChecks.counterweightBolts.na"
                  noteName="formData.powerOffChecks.counterweightBolts.note"
                  register={register}
                />

                <CheckboxGroup
                  label="10. Cover panels"
                  okName="formData.powerOffChecks.coverPanels.ok"
                  noName="formData.powerOffChecks.coverPanels.no"
                  naName="formData.powerOffChecks.coverPanels.na"
                  noteName="formData.powerOffChecks.coverPanels.note"
                  register={register}
                />

                <CheckboxGroup
                  label="11. Boom valley/under platform – leaks/debris"
                  okName="formData.powerOffChecks.boomValleyUnderPlatform.ok"
                  noName="formData.powerOffChecks.boomValleyUnderPlatform.no"
                  naName="formData.powerOffChecks.boomValleyUnderPlatform.na"
                  noteName="formData.powerOffChecks.boomValleyUnderPlatform.note"
                  register={register}
                />

                <CheckboxGroup
                  label="12. Accessory plugs and cables"
                  okName="formData.powerOffChecks.accessoryPlugsCables.ok"
                  noName="formData.powerOffChecks.accessoryPlugsCables.no"
                  naName="formData.powerOffChecks.accessoryPlugsCables.na"
                  noteName="formData.powerOffChecks.accessoryPlugsCables.note"
                  register={register}
                />

                <CheckboxGroup
                  label="13. Boom/lift arms – general condition/wear"
                  okName="formData.powerOffChecks.boomLiftArmsCondition.ok"
                  noName="formData.powerOffChecks.boomLiftArmsCondition.no"
                  naName="formData.powerOffChecks.boomLiftArmsCondition.na"
                  noteName="formData.powerOffChecks.boomLiftArmsCondition.note"
                  register={register}
                />

                <CheckboxGroup
                  label="14. Power track – lines/hoses"
                  okName="formData.powerOffChecks.powerTrackLinesHoses.ok"
                  noName="formData.powerOffChecks.powerTrackLinesHoses.no"
                  naName="formData.powerOffChecks.powerTrackLinesHoses.na"
                  noteName="formData.powerOffChecks.powerTrackLinesHoses.note"
                  register={register}
                />

                <CheckboxGroup
                  label="15. Safety prop functional ?????????"
                  okName="formData.powerOffChecks.safetyPropFunctional.ok"
                  noName="formData.powerOffChecks.safetyPropFunctional.no"
                  naName="formData.powerOffChecks.safetyPropFunctional.na"
                  noteName="formData.powerOffChecks.safetyPropFunctional.note"
                  register={register}
                />

                <CheckboxGroup
                  label="16. Platform–guardrails/toeboard/anchorages/gate"
                  okName="formData.powerOffChecks.platformGuardrailsEtc.ok"
                  noName="formData.powerOffChecks.platformGuardrailsEtc.no"
                  naName="formData.powerOffChecks.platformGuardrailsEtc.na"
                  noteName="formData.powerOffChecks.platformGuardrailsEtc.note"
                  register={register}
                />

                <CheckboxGroup
                  label="17. Weather-resistant storage compartment/manuals"
                  okName="formData.powerOffChecks.storageCompartmentManuals.ok"
                  noName="formData.powerOffChecks.storageCompartmentManuals.no"
                  naName="formData.powerOffChecks.storageCompartmentManuals.na"
                  noteName="formData.powerOffChecks.storageCompartmentManuals.note"
                  register={register}
                />

                <CheckboxGroup
                  label="18. Control markings visible"
                  okName="formData.powerOffChecks.controlMarkingsVisible.ok"
                  noName="formData.powerOffChecks.controlMarkingsVisible.no"
                  naName="formData.powerOffChecks.controlMarkingsVisible.na"
                  noteName="formData.powerOffChecks.controlMarkingsVisible.note"
                  register={register}
                />

                <CheckboxGroup
                  label="19. Other:"
                  okName="formData.powerOffChecks.other1.ok"
                  noName="formData.powerOffChecks.other1.no"
                  naName="formData.powerOffChecks.other1.na"
                  noteName="formData.powerOffChecks.other1.note"
                  register={register}
                />

                <CheckboxGroup
                  label="20. Other:"
                  okName="formData.powerOffChecks.other2.ok"
                  noName="formData.powerOffChecks.other2.no"
                  naName="formData.powerOffChecks.other2.na"
                  noteName="formData.powerOffChecks.other2.note"
                  register={register}
                />

                <CheckboxGroup
                  label="21. Other:"
                  okName="formData.powerOffChecks.other3.ok"
                  noName="formData.powerOffChecks.other3.no"
                  naName="formData.powerOffChecks.other3.na"
                  noteName="formData.powerOffChecks.other3.note"
                  register={register}
                />
              </div>
            </div>
          </div>
          {/* Power On Checks Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Power On Checks
            </h2>

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center py-2 bg-blue-100">
                <div className="col-span-5 pl-2 font-semibold">Item</div>
                <div className="col-span-1 text-center font-semibold">OK</div>
                <div className="col-span-1 text-center font-semibold">No</div>
                <div className="col-span-1 text-center font-semibold">N/A</div>
                <div className="col-span-4 text-center font-semibold">Note</div>
              </div>

              <div className="p-2">
                <CheckboxGroup
                  label="22. Unit starts and runs properly"
                  okName="formData.powerOnChecks.unitStartsRunsProperly.ok"
                  noName="formData.powerOnChecks.unitStartsRunsProperly.no"
                  naName="formData.powerOnChecks.unitStartsRunsProperly.na"
                  noteName="formData.powerOnChecks.unitStartsRunsProperly.note"
                  register={register}
                />

                <CheckboxGroup
                  label="23. Instruments/gauges"
                  okName="formData.powerOnChecks.instrumentsGauges.ok"
                  noName="formData.powerOnChecks.instrumentsGauges.no"
                  naName="formData.powerOnChecks.instrumentsGauges.na"
                  noteName="formData.powerOnChecks.instrumentsGauges.note"
                  register={register}
                />

                <CheckboxGroup
                  label="24. Warning lights/audible alarms"
                  okName="formData.powerOnChecks.warningLightsAlarms.ok"
                  noName="formData.powerOnChecks.warningLightsAlarms.no"
                  naName="formData.powerOnChecks.warningLightsAlarms.na"
                  noteName="formData.powerOnChecks.warningLightsAlarms.note"
                  register={register}
                />

                <CheckboxGroup
                  label="25. Fuel/charge level"
                  okName="formData.powerOnChecks.fuelChargeLevel.ok"
                  noName="formData.powerOnChecks.fuelChargeLevel.no"
                  naName="formData.powerOnChecks.fuelChargeLevel.na"
                  noteName="formData.powerOnChecks.fuelChargeLevel.note"
                  register={register}
                />

                <CheckboxGroup
                  label="26. Horn/audible warning device(s)"
                  okName="formData.powerOnChecks.hornWarningDevices.ok"
                  noName="formData.powerOnChecks.hornWarningDevices.no"
                  naName="formData.powerOnChecks.hornWarningDevices.na"
                  noteName="formData.powerOnChecks.hornWarningDevices.note"
                  register={register}
                />

                <div className="pl-4 mt-2 mb-1 font-medium">
                  27. Function controls:
                </div>

                <CheckboxGroup
                  label="a. Boom/jib/lift arms – raise/lower/extend/retract"
                  okName="formData.powerOnChecks.boomJibLiftArms.ok"
                  noName="formData.powerOnChecks.boomJibLiftArms.no"
                  naName="formData.powerOnChecks.boomJibLiftArms.na"
                  noteName="formData.powerOnChecks.boomJibLiftArms.note"
                  register={register}
                />

                <CheckboxGroup
                  label="b. Turret rotate"
                  okName="formData.powerOnChecks.turretRotate.ok"
                  noName="formData.powerOnChecks.turretRotate.no"
                  naName="formData.powerOnChecks.turretRotate.na"
                  noteName="formData.powerOnChecks.turretRotate.note"
                  register={register}
                />

                <CheckboxGroup
                  label="c. Drive - forward/reverse"
                  okName="formData.powerOnChecks.driveForwardReverse.ok"
                  noName="formData.powerOnChecks.driveForwardReverse.no"
                  naName="formData.powerOnChecks.driveForwardReverse.na"
                  noteName="formData.powerOnChecks.driveForwardReverse.note"
                  register={register}
                />

                <CheckboxGroup
                  label="d. Steer – left/right"
                  okName="formData.powerOnChecks.steerLeftRight.ok"
                  noName="formData.powerOnChecks.steerLeftRight.no"
                  naName="formData.powerOnChecks.steerLeftRight.na"
                  noteName="formData.powerOnChecks.steerLeftRight.note"
                  register={register}
                />

                <CheckboxGroup
                  label="e. Platform – tilt/rotate/extend"
                  okName="formData.powerOnChecks.platformTiltRotateExtend.ok"
                  noName="formData.powerOnChecks.platformTiltRotateExtend.no"
                  naName="formData.powerOnChecks.platformTiltRotateExtend.na"
                  noteName="formData.powerOnChecks.platformTiltRotateExtend.note"
                  register={register}
                />

                <CheckboxGroup
                  label="f. Stability enhancing devices"
                  okName="formData.powerOnChecks.stabilityEnhancingDevices.ok"
                  noName="formData.powerOnChecks.stabilityEnhancingDevices.no"
                  naName="formData.powerOnChecks.stabilityEnhancingDevices.na"
                  noteName="formData.powerOnChecks.stabilityEnhancingDevices.note"
                  register={register}
                />

                <CheckboxGroup
                  label="g. Function – enable (deadman) devices"
                  okName="formData.powerOnChecks.functionEnableDevices.ok"
                  noName="formData.powerOnChecks.functionEnableDevices.no"
                  naName="formData.powerOnChecks.functionEnableDevices.na"
                  noteName="formData.powerOnChecks.functionEnableDevices.note"
                  register={register}
                />

                <CheckboxGroup
                  label="28. Emergency/auxiliary controls"
                  okName="formData.powerOnChecks.emergencyAuxiliaryControls.ok"
                  noName="formData.powerOnChecks.emergencyAuxiliaryControls.no"
                  naName="formData.powerOnChecks.emergencyAuxiliaryControls.na"
                  noteName="formData.powerOnChecks.emergencyAuxiliaryControls.note"
                  register={register}
                />

                <CheckboxGroup
                  label="29. Safety interlocks"
                  okName="formData.powerOnChecks.safetyInterlocks.ok"
                  noName="formData.powerOnChecks.safetyInterlocks.no"
                  naName="formData.powerOnChecks.safetyInterlocks.na"
                  noteName="formData.powerOnChecks.safetyInterlocks.note"
                  register={register}
                />

                <CheckboxGroup
                  label="30. Braking – stops & holds"
                  okName="formData.powerOnChecks.brakingStopsHolds.ok"
                  noName="formData.powerOnChecks.brakingStopsHolds.no"
                  naName="formData.powerOnChecks.brakingStopsHolds.na"
                  noteName="formData.powerOnChecks.brakingStopsHolds.note"
                  register={register}
                />

                <CheckboxGroup
                  label="31. Other:"
                  okName="formData.powerOnChecks.otherPowerOn.ok"
                  noName="formData.powerOnChecks.otherPowerOn.no"
                  naName="formData.powerOnChecks.otherPowerOn.na"
                  noteName="formData.powerOnChecks.otherPowerOn.note"
                  register={register}
                />
              </div>
            </div>
          </div>
          {/* General Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">General</h2>

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center py-2 bg-blue-100">
                <div className="col-span-5 pl-2 font-semibold">Item</div>
                <div className="col-span-1 text-center font-semibold">OK</div>
                <div className="col-span-1 text-center font-semibold">No</div>
                <div className="col-span-1 text-center font-semibold">N/A</div>
                <div className="col-span-4 text-center font-semibold">Note</div>
              </div>

              <div className="p-2">
                <CheckboxGroup
                  label="32. Mfr. operating manual stored on MEWP"
                  okName="formData.generalChecks.mfrOperatingManual.ok"
                  noName="formData.generalChecks.mfrOperatingManual.no"
                  naName="formData.generalChecks.mfrOperatingManual.na"
                  noteName="formData.generalChecks.mfrOperatingManual.note"
                  register={register}
                />

                <CheckboxGroup
                  label="33. Safety decals/warnings/placards"
                  okName="formData.generalChecks.safetyDecalsWarnings.ok"
                  noName="formData.generalChecks.safetyDecalsWarnings.no"
                  naName="formData.generalChecks.safetyDecalsWarnings.na"
                  noteName="formData.generalChecks.safetyDecalsWarnings.note"
                  register={register}
                />

                <CheckboxGroup
                  label="34. Misc. parts – loose/missing/broken"
                  okName="formData.generalChecks.miscPartsLooseMissingBroken.ok"
                  noName="formData.generalChecks.miscPartsLooseMissingBroken.no"
                  naName="formData.generalChecks.miscPartsLooseMissingBroken.na"
                  noteName="formData.generalChecks.miscPartsLooseMissingBroken.note"
                  register={register}
                />
              </div>
            </div>
          </div>

          {/* Work Area Inspection */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Work Area Inspection
            </h2>

            <div className="border rounded-md overflow-hidden">
              <div className="grid grid-cols-12 gap-2 items-center py-2 bg-blue-100">
                <div className="col-span-5 pl-2 font-semibold">Item</div>
                <div className="col-span-1 text-center font-semibold">OK</div>
                <div className="col-span-1 text-center font-semibold">No</div>
                <div className="col-span-1 text-center font-semibold">N/A</div>
                <div className="col-span-4 text-center font-semibold">Note</div>
              </div>

              <div className="p-2">
                <CheckboxGroup
                  label="35. Drop-offs or holes"
                  okName="formData.workAreaChecks.dropOffsHoles.ok"
                  noName="formData.workAreaChecks.dropOffsHoles.no"
                  naName="formData.workAreaChecks.dropOffsHoles.na"
                  noteName="formData.workAreaChecks.dropOffsHoles.note"
                  register={register}
                />

                <CheckboxGroup
                  label="36. Bumps and floor/ground obstructions"
                  okName="formData.workAreaChecks.bumpsFloorObstructions.ok"
                  noName="formData.workAreaChecks.bumpsFloorObstructions.no"
                  naName="formData.workAreaChecks.bumpsFloorObstructions.na"
                  noteName="formData.workAreaChecks.bumpsFloorObstructions.note"
                  register={register}
                />

                <CheckboxGroup
                  label="37. Debris"
                  okName="formData.workAreaChecks.debris.ok"
                  noName="formData.workAreaChecks.debris.no"
                  naName="formData.workAreaChecks.debris.na"
                  noteName="formData.workAreaChecks.debris.note"
                  register={register}
                />

                <CheckboxGroup
                  label="38. Overhead obstructions"
                  okName="formData.workAreaChecks.overheadObstructions.ok"
                  noName="formData.workAreaChecks.overheadObstructions.no"
                  naName="formData.workAreaChecks.overheadObstructions.na"
                  noteName="formData.workAreaChecks.overheadObstructions.note"
                  register={register}
                />

                <CheckboxGroup
                  label="39. Energized power lines"
                  okName="formData.workAreaChecks.energizedPowerLines.ok"
                  noName="formData.workAreaChecks.energizedPowerLines.no"
                  naName="formData.workAreaChecks.energizedPowerLines.na"
                  noteName="formData.workAreaChecks.energizedPowerLines.note"
                  register={register}
                />

                <CheckboxGroup
                  label="40. Hazardous locations"
                  okName="formData.workAreaChecks.hazardousLocations.ok"
                  noName="formData.workAreaChecks.hazardousLocations.no"
                  naName="formData.workAreaChecks.hazardousLocations.na"
                  noteName="formData.workAreaChecks.hazardousLocations.note"
                  register={register}
                />

                <CheckboxGroup
                  label="41. Ground surface and support conditions"
                  okName="formData.workAreaChecks.groundSurfaceSupport.ok"
                  noName="formData.workAreaChecks.groundSurfaceSupport.no"
                  naName="formData.workAreaChecks.groundSurfaceSupport.na"
                  noteName="formData.workAreaChecks.groundSurfaceSupport.note"
                  register={register}
                />

                <CheckboxGroup
                  label="42. Pedestrian/vehicle traffic"
                  okName="formData.workAreaChecks.pedestrianVehicleTraffic.ok"
                  noName="formData.workAreaChecks.pedestrianVehicleTraffic.no"
                  naName="formData.workAreaChecks.pedestrianVehicleTraffic.na"
                  noteName="formData.workAreaChecks.pedestrianVehicleTraffic.note"
                  register={register}
                />

                <CheckboxGroup
                  label="43. Wind and weather conditions"
                  okName="formData.workAreaChecks.windWeatherConditions.ok"
                  noName="formData.workAreaChecks.windWeatherConditions.no"
                  naName="formData.workAreaChecks.windWeatherConditions.na"
                  noteName="formData.workAreaChecks.windWeatherConditions.note"
                  register={register}
                />

                <CheckboxGroup
                  label="44. Other possible hazards:"
                  okName="formData.workAreaChecks.otherPossibleHazards.ok"
                  noName="formData.workAreaChecks.otherPossibleHazards.no"
                  naName="formData.workAreaChecks.otherPossibleHazards.na"
                  noteName="formData.workAreaChecks.otherPossibleHazards.note"
                  register={register}
                />
              </div>
            </div>
          </div>

          {/* Comments/Action Items */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Comments/Action Items
            </h2>
            <p className="text-gray-600 mb-4">
              Report any problems found to supervisor. ALWAYS lock/tag-out
              unsafe equipment.
            </p>

            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-100">
                  <tr>
                    <th className="p-2 text-left w-1/6">Item #</th>
                    <th className="p-2 text-left w-5/6">
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
                            `formData.commentItems.${index}.itemNumber`
                          )}
                          className="w-full p-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        />
                      </td>
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
                  Generate PDF for this MEWP Inspection
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
