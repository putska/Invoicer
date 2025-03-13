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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";

// ---------------- Schema & Types ----------------

// Define the Option type
type Option = {
  label: string;
  value: string;
};

// Nature of injury options
const natureOfInjuryOptions = [
  { label: "Abrasion, scrapes", value: "abrasionScrapes" },
  { label: "Amputation", value: "amputation" },
  { label: "Broken bone", value: "brokenBone" },
  { label: "Bruise", value: "bruise" },
  { label: "Burn (heat)", value: "burnHeat" },
  { label: "Burn (chemical)", value: "burnChemical" },
  { label: "Concussion (to the head)", value: "concussion" },
  { label: "Crushing injury", value: "crushingInjury" },
  { label: "Cut, laceration, puncture", value: "cutLacerationPuncture" },
  { label: "Hernia", value: "hernia" },
  { label: "Illness", value: "illness" },
  { label: "Sprain, strain", value: "sprainStrain" },
  {
    label:
      "Damage to a body system (EG: nervous, respiratory, or circulatory systems)",
    value: "damageToBodySystem",
  },
  { label: "Other", value: "other" },
];

// Employee work type options
const employeeWorkTypeOptions = [
  { label: "Regular full time", value: "regularFullTime" },
  { label: "Regular part time", value: "regularPartTime" },
  { label: "Seasonal", value: "seasonal" },
  { label: "Temporary", value: "temporary" },
];

// Workday part options
const workdayPartOptions = [
  { label: "Entering or leaving work", value: "enteringLeaving" },
  { label: "Doing normal work activities", value: "normalWork" },
  { label: "During meal period", value: "mealPeriod" },
  { label: "During break", value: "duringBreak" },
  { label: "Working overtime", value: "overtime" },
  { label: "Other", value: "other" },
];

// Unsafe workplace conditions options
const unsafeWorkplaceConditionsOptions = [
  { label: "Inadequate guard", value: "inadequateGuard" },
  { label: "Unguarded hazard", value: "unguardedHazard" },
  { label: "Safety device is defective", value: "safetyDeviceDefective" },
  { label: "Tool or equipment is defective", value: "toolEquipmentDefective" },
  { label: "Workstation layout is hazardous", value: "workstationHazardous" },
  { label: "Unsafe lighting", value: "unsafeLighting" },
  { label: "Unsafe ventilation", value: "unsafeVentilation" },
  { label: "Lack of needed personal protective equipment", value: "lackOfPpe" },
  { label: "Lack of appropriate equipment / tools", value: "lackOfEquipment" },
  { label: "Unsafe clothing", value: "unsafeClothing" },
  {
    label: "No training or insufficient training",
    value: "insufficientTraining",
  },
  { label: "Other", value: "other" },
];

// Unsafe acts options
const unsafeActsOptions = [
  {
    label: "Operating without permission",
    value: "operatingWithoutPermission",
  },
  { label: "Operating at unsafe speed", value: "operatingUnsafeSpeed" },
  {
    label: "Servicing equipment that has power to it",
    value: "servicingPoweredEquipment",
  },
  {
    label: "Making a safety device inoperative",
    value: "safetyDeviceInoperative",
  },
  { label: "Using defective equipment", value: "usingDefectiveEquipment" },
  {
    label: "Using equipment in an unapproved way",
    value: "usingEquipmentImproperly",
  },
  { label: "Unsafe lifting by hand", value: "unsafeLifting" },
  { label: "Taking an unsafe position or posture", value: "unsafePosition" },
  { label: "Distraction, teasing, horseplay", value: "distractionHorseplay" },
  {
    label: "Failure to wear personal protective equipment",
    value: "failureToWearPpe",
  },
  {
    label: "Failure to use the available equipment / tools",
    value: "failureToUseEquipment",
  },
  { label: "Other", value: "other" },
];

// Accident classification options
const accidentClassificationOptions = [
  { label: "Injury", value: "injury" },
  { label: "Illness", value: "illness" },
  { label: "Fatality", value: "fatality" },
  { label: "Property Damage", value: "propertyDamage" },
  { label: "Environment", value: "environment" },
  { label: "Procedural Issues", value: "proceduralIssues" },
  { label: "Other", value: "other" },
];

// Days of the week options
const daysOfWeekOptions = [
  { label: "M", value: "m" },
  { label: "T", value: "t" },
  { label: "W", value: "w" },
  { label: "TH", value: "th" },
  { label: "F", value: "f" },
  { label: "S", value: "s" },
  { label: "SU", value: "su" },
];

// Report made by options
const reportMadeByOptions = [
  { label: "Employee", value: "employee" },
  { label: "Superintendent", value: "superintendent" },
  { label: "Management", value: "management" },
  { label: "Final Report", value: "finalReport" },
];

interface BodyMarker {
  view: "front" | "back";
  x: number;
  y: number;
}

const bodyMarkerSchema = z.object({
  view: z.enum(["front", "back"]),
  x: z.number(),
  y: z.number(),
});

// Main form schema
const accidentReportSchema = z.object({
  formName: z.string().default("Accident Incident Report"),
  pdfName: z.string().default("AccidentReport.pdf"),
  userName: z.string().min(1, "User name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  formData: z.object({
    // Step 1: Accident Classification
    accidentClassification: z.object({
      injury: z.boolean().default(false),
      illness: z.boolean().default(false),
      fatality: z.boolean().default(false),
      propertyDamage: z.boolean().default(false),
      environment: z.boolean().default(false),
      proceduralIssues: z.boolean().default(false),
      other: z.boolean().default(false),
      otherDescription: z.string().optional(),
    }),

    // Day and Date of accident
    dayOfAccident: z.object({
      m: z.boolean().default(false),
      t: z.boolean().default(false),
      w: z.boolean().default(false),
      th: z.boolean().default(false),
      f: z.boolean().default(false),
      s: z.boolean().default(false),
      su: z.boolean().default(false),
      date: z.string().min(1, "Date is required"),
    }),

    // Report made by
    reportMadeBy: z.object({
      employee: z.boolean().default(false),
      superintendent: z.boolean().default(false),
      management: z.boolean().default(false),
      finalReport: z.boolean().default(false),
    }),

    firstReportedTo: z.string().optional(),
    dateFirstReported: z.string().optional(),

    // Step 1: Personal Information
    personalInfo: z.object({
      name: z.string().min(1, "Name is required"),
      sex: z.enum(["Male", "Female", ""]).optional(),
      age: z.string().optional(),
      employedBy: z.string().min(1, "Employer is required"),
      jobTitle: z.string().min(1, "Job title is required"),
      bodyMarkers: z.array(bodyMarkerSchema).default([]),
      natureOfInjury: z.object({
        abrasionScrapes: z.boolean().default(false),
        amputation: z.boolean().default(false),
        brokenBone: z.boolean().default(false),
        bruise: z.boolean().default(false),
        burnHeat: z.boolean().default(false),
        burnChemical: z.boolean().default(false),
        concussion: z.boolean().default(false),
        crushingInjury: z.boolean().default(false),
        cutLacerationPuncture: z.boolean().default(false),
        hernia: z.boolean().default(false),
        illness: z.boolean().default(false),
        sprainStrain: z.boolean().default(false),
        damageToBodySystem: z.boolean().default(false),
        other: z.boolean().default(false),
        otherDescription: z.string().optional(),
      }),
      employeeWorks: z.object({
        regularFullTime: z.boolean().default(false),
        regularPartTime: z.boolean().default(false),
        seasonal: z.boolean().default(false),
        temporary: z.boolean().default(false),
      }),
      superintendentName: z.string().optional(),
      wasPersonTrained: z.string().optional(),
      trainingType: z.string().optional(),
    }),

    // Step 2: Witness Information
    witnessInfo: z
      .array(
        z.object({
          name: z.string().optional(),
          jobTitle: z.string().optional(),
          employedBy: z.string().optional(),
          supervisorName: z.string().optional(),
        })
      )
      .min(2)
      .default([{}, {}]), // Default to 2 empty witness entries

    siteSecured: z.enum(["Yes", "No", ""]).optional(),
    securedBy: z.string().optional(),

    // Step 3: Accident Description
    accidentDescription: z.object({
      exactLocation: z.string().min(1, "Location is required"),
      jobNameNumber: z.string().min(1, "Job name/number is required"),
      exactTime: z.string().min(1, "Time is required"),
      workdayPart: z.object({
        enteringLeaving: z.boolean().default(false),
        normalWork: z.boolean().default(false),
        mealPeriod: z.boolean().default(false),
        duringBreak: z.boolean().default(false),
        overtime: z.boolean().default(false),
        other: z.boolean().default(false),
      }),
      description: z.string().min(1, "Description is required"),
      equipmentInvolved: z.string().optional(),
      ppeUsed: z.string().optional(),
      directCause: z.string().min(1, "Direct cause is required"),
      indirectCause: z.string().optional(),
      preventionActions: z.string().min(1, "Prevention actions are required"),
    }),

    // Step 4: Why did the accident happen?
    accidentCauses: z.object({
      unsafeConditions: z.object({
        inadequateGuard: z.boolean().default(false),
        unguardedHazard: z.boolean().default(false),
        safetyDeviceDefective: z.boolean().default(false),
        toolEquipmentDefective: z.boolean().default(false),
        workstationHazardous: z.boolean().default(false),
        unsafeLighting: z.boolean().default(false),
        unsafeVentilation: z.boolean().default(false),
        lackOfPpe: z.boolean().default(false),
        lackOfEquipment: z.boolean().default(false),
        unsafeClothing: z.boolean().default(false),
        insufficientTraining: z.boolean().default(false),
        other: z.boolean().default(false),
        otherDescription: z.string().optional(),
      }),
      unsafeActs: z.object({
        operatingWithoutPermission: z.boolean().default(false),
        operatingUnsafeSpeed: z.boolean().default(false),
        servicingPoweredEquipment: z.boolean().default(false),
        safetyDeviceInoperative: z.boolean().default(false),
        usingDefectiveEquipment: z.boolean().default(false),
        usingEquipmentImproperly: z.boolean().default(false),
        unsafeLifting: z.boolean().default(false),
        unsafePosition: z.boolean().default(false),
        distractionHorseplay: z.boolean().default(false),
        failureToWearPpe: z.boolean().default(false),
        failureToUseEquipment: z.boolean().default(false),
        other: z.boolean().default(false),
        otherDescription: z.string().optional(),
      }),
      whyUnsafeConditions: z.string().optional(),
      whyUnsafeActs: z.string().optional(),
      rewardForUnsafeActs: z.enum(["Yes", "No", ""]).optional(),
      rewardDescription: z.string().optional(),
      unsafeActsReportedPrior: z.enum(["Yes", "No", ""]).optional(),
      unsafeActsReportedExplanation: z.string().optional(),
      similarAccidentsPrior: z.enum(["Yes", "No", ""]).optional(),
      similarAccidentsDescription: z.string().optional(),
    }),

    // Step 5: OSHA Information
    oshaInfo: z.object({
      dateNotified: z.string().optional(),
      investigationDates: z.string().optional(),
      citationDate: z.string().optional(),
      penaltyAmount: z.string().optional(),
    }),

    // Step 6: Report Preparer
    reportPreparer: z.object({
      name: z.string().min(1, "Name is required"),
      dateOfReport: z.string().min(1, "Date is required"),
      title: z.string().optional(),
      employer: z.string().optional(),
      phoneNumber: z.string().optional(),
    }),

    generatePDF: z.boolean().default(false),
  }),
});

type AccidentReportForm = z.infer<typeof accidentReportSchema>;

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
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

// Checkboxes group component for multiple options
const CheckboxesGroup = ({
  options,
  basePath,
  register,
  title,
  otherPath,
  otherRegister,
}: {
  options: Option[];
  basePath: string;
  register: any;
  title?: string;
  otherPath?: string;
  otherRegister?: any;
}) => {
  return (
    <div className="mb-4">
      {title && <p className="font-medium mb-2">{title}</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {options.map((option, index) => {
          const fieldName = `${basePath}.${option.value}`;
          const isOtherOption = option.value === "other";

          return (
            <div key={index} className="flex items-start">
              <input
                type="checkbox"
                id={fieldName}
                {...register(fieldName as keyof AccidentReportForm)}
                className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label
                htmlFor={fieldName}
                className="ml-2 block text-sm text-gray-700"
              >
                {option.label}
              </label>
              {isOtherOption && otherPath && otherRegister && (
                <input
                  type="text"
                  {...otherRegister(otherPath)}
                  placeholder="Please specify"
                  className="ml-2 px-2 py-0.5 text-sm border border-gray-300 rounded"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Radio button group component
const RadioGroup = ({
  options,
  name,
  register,
  label,
}: {
  options: string[];
  name: string;
  register: any;
  label: string;
}) => {
  return (
    <div className="mb-4">
      <label className="block text-gray-700 mb-1">{label}</label>
      <div className="flex space-x-4">
        {options.map((option) => (
          <div key={option} className="flex items-center">
            <input
              type="radio"
              id={`${name}-${option}`}
              value={option}
              {...register(name)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
            />
            <label
              htmlFor={`${name}-${option}`}
              className="ml-2 block text-sm text-gray-700"
            >
              {option}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

// Interactive body diagram component
const BodyDiagram = () => {
  const { setValue, watch } = useFormContext();
  const bodyMarkers =
    (watch("formData.personalInfo.bodyMarkers") as BodyMarker[]) || [];

  const addMarker = (
    view: "front" | "back",
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    // Get click coordinates relative to the image
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // Convert to percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100; // Convert to percentage

    // Add the new marker to existing markers
    const newMarkers: BodyMarker[] = [...bodyMarkers, { view, x, y }];
    setValue("formData.personalInfo.bodyMarkers", newMarkers);
  };

  const removeMarker = (index: number) => {
    const newMarkers = bodyMarkers.filter((_, i) => i !== index);
    setValue("formData.personalInfo.bodyMarkers", newMarkers);
  };

  return (
    <div className="mb-4">
      <p className="font-medium mb-2">
        Body diagram - click to mark injury locations:
      </p>
      <div className="flex justify-between bg-gray-100 p-4 rounded-md">
        <div className="text-center relative">
          <p className="mb-2">Front</p>
          <div
            className="w-48 h-auto mx-auto relative cursor-crosshair"
            onClick={(e) => addMarker("front", e)}
          >
            <img
              src="/images/body-front.jpg"
              alt="Body diagram front view"
              className="border border-gray-300 rounded-md"
              style={{ maxHeight: "400px", width: "auto" }}
            />

            {/* Render markers for front view */}
            {bodyMarkers
              .filter((marker) => marker.view === "front")
              .map((marker, index) => (
                <div
                  key={index}
                  className="absolute h-4 w-4 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    const markerIndex = bodyMarkers.findIndex(
                      (m) =>
                        m.view === "front" &&
                        m.x === marker.x &&
                        m.y === marker.y
                    );
                    if (markerIndex !== -1) {
                      removeMarker(markerIndex);
                    }
                  }}
                  title="Click to remove marker"
                />
              ))}
          </div>
        </div>

        <div className="text-center relative">
          <p className="mb-2">Back</p>
          <div
            className="w-48 h-auto mx-auto relative cursor-crosshair"
            onClick={(e) => addMarker("back", e)}
          >
            <img
              src="/images/body-back.jpg"
              alt="Body diagram back view"
              className="border border-gray-300 rounded-md"
              style={{ maxHeight: "400px", width: "auto" }}
            />

            {/* Render markers for back view */}
            {bodyMarkers
              .filter((marker) => marker.view === "back")
              .map((marker, index) => (
                <div
                  key={index}
                  className="absolute h-4 w-4 bg-red-500 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    const markerIndex = bodyMarkers.findIndex(
                      (m) =>
                        m.view === "back" &&
                        m.x === marker.x &&
                        m.y === marker.y
                    );
                    if (markerIndex !== -1) {
                      removeMarker(markerIndex);
                    }
                  }}
                  title="Click to remove marker"
                />
              ))}
          </div>
        </div>
      </div>

      {/* Instructions for users */}
      <div className="mt-2 text-sm text-gray-600">
        <p>
          Click on either diagram to mark injury locations. Click on a marker to
          remove it.
        </p>
        {bodyMarkers.length > 0 && (
          <p className="mt-1">Current markers: {bodyMarkers.length}</p>
        )}
      </div>
    </div>
  );
};

// ---------------- Main Component ----------------

export default function Page() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [activeTab, setActiveTab] = useState("step1");
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<AccidentReportForm>({
    resolver: zodResolver(accidentReportSchema),
    defaultValues: {
      formName: "Accident-Incident-Report",
      pdfName: "AccidentReport.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "",
      formData: {
        accidentClassification: {
          injury: false,
          illness: false,
          fatality: false,
          propertyDamage: false,
          environment: false,
          proceduralIssues: false,
          other: false,
          otherDescription: "",
        },
        dayOfAccident: {
          m: false,
          t: false,
          w: false,
          th: false,
          f: false,
          s: false,
          su: false,
          date: new Date().toISOString().split("T")[0],
        },
        reportMadeBy: {
          employee: false,
          superintendent: false,
          management: false,
          finalReport: false,
        },
        firstReportedTo: "",
        dateFirstReported: new Date().toISOString().split("T")[0],
        personalInfo: {
          name: "",
          sex: "",
          age: "",
          employedBy: "",
          jobTitle: "",
          natureOfInjury: {
            abrasionScrapes: false,
            amputation: false,
            brokenBone: false,
            bruise: false,
            burnHeat: false,
            burnChemical: false,
            concussion: false,
            crushingInjury: false,
            cutLacerationPuncture: false,
            hernia: false,
            illness: false,
            sprainStrain: false,
            damageToBodySystem: false,
            other: false,
            otherDescription: "",
          },
          employeeWorks: {
            regularFullTime: false,
            regularPartTime: false,
            seasonal: false,
            temporary: false,
          },
          superintendentName: "",
          wasPersonTrained: "",
          trainingType: "",
        },
        witnessInfo: [{}, {}],
        siteSecured: "",
        securedBy: "",
        accidentDescription: {
          exactLocation: "",
          jobNameNumber: "",
          exactTime: "",
          workdayPart: {
            enteringLeaving: false,
            normalWork: false,
            mealPeriod: false,
            duringBreak: false,
            overtime: false,
            other: false,
          },
          description: "",
          equipmentInvolved: "",
          ppeUsed: "",
          directCause: "",
          indirectCause: "",
          preventionActions: "",
        },
        accidentCauses: {
          unsafeConditions: {
            inadequateGuard: false,
            unguardedHazard: false,
            safetyDeviceDefective: false,
            toolEquipmentDefective: false,
            workstationHazardous: false,
            unsafeLighting: false,
            unsafeVentilation: false,
            lackOfPpe: false,
            lackOfEquipment: false,
            unsafeClothing: false,
            insufficientTraining: false,
            other: false,
            otherDescription: "",
          },
          unsafeActs: {
            operatingWithoutPermission: false,
            operatingUnsafeSpeed: false,
            servicingPoweredEquipment: false,
            safetyDeviceInoperative: false,
            usingDefectiveEquipment: false,
            usingEquipmentImproperly: false,
            unsafeLifting: false,
            unsafePosition: false,
            distractionHorseplay: false,
            failureToWearPpe: false,
            failureToUseEquipment: false,
            other: false,
            otherDescription: "",
          },
          whyUnsafeConditions: "",
          whyUnsafeActs: "",
          rewardForUnsafeActs: "",
          rewardDescription: "",
          unsafeActsReportedPrior: "",
          unsafeActsReportedExplanation: "",
          similarAccidentsPrior: "",
          similarAccidentsDescription: "",
        },
        oshaInfo: {
          dateNotified: "",
          investigationDates: "",
          citationDate: "",
          penaltyAmount: "",
        },
        reportPreparer: {
          name: fullName || "",
          dateOfReport: new Date().toISOString().split("T")[0],
          title: "",
          employer: "",
          phoneNumber: "",
        },
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

  // Field array for witnesses
  const {
    fields: witnessFields,
    append: appendWitness,
    remove: removeWitness,
  } = useFieldArray({
    control,
    name: "formData.witnessInfo",
  });

  // ---------------- Debounced Auto-Save ----------------

  // Watch form values so we can auto-save drafts for existing records
  const watchedValues = useWatch({ control });

  const saveDraft = useCallback(
    async (data: AccidentReportForm) => {
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
      setValue("formData.reportPreparer.name", fullName);
    }
  }, [fullName, setValue]);

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

  const onSubmit = async (formData: AccidentReportForm) => {
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
          jobName: "",
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
          ? "Edit Accident/Incident Report"
          : "New Accident/Incident Report"}
      </h1>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit, (errors) =>
            console.error("Validation errors:", errors)
          )}
          className="space-y-4"
        >
          <Tabs
            defaultValue="step1"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-7 mb-4">
              <TabsTrigger value="step1">
                Classification & Personal Info
              </TabsTrigger>
              <TabsTrigger value="step2">Witnesses</TabsTrigger>
              <TabsTrigger value="step3">Description</TabsTrigger>
              <TabsTrigger value="step4">Causes</TabsTrigger>
              <TabsTrigger value="step5">OSHA</TabsTrigger>
              <TabsTrigger value="step6">Preparer</TabsTrigger>
              <TabsTrigger value="tips">Tips</TabsTrigger>
            </TabsList>

            {/* Step 1: Classification & Personal Information */}
            <TabsContent value="step1" className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h2 className="text-xl font-medium text-gray-700 mb-4">
                  Accident Classification
                </h2>

                <div className="grid grid-cols-1 gap-4">
                  <CheckboxesGroup
                    options={accidentClassificationOptions}
                    basePath="formData.accidentClassification"
                    register={register}
                    otherPath="formData.accidentClassification.otherDescription"
                    otherRegister={register}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="font-medium mb-2">Day of accident:</p>
                      <div className="flex flex-wrap gap-2">
                        {daysOfWeekOptions.map((day) => (
                          <div key={day.value} className="flex items-center">
                            <input
                              type="checkbox"
                              id={`day-${day.value}`}
                              {...register(
                                `formData.dayOfAccident.${day.value}` as any
                              )}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={`day-${day.value}`}
                              className="ml-1 text-sm text-gray-700"
                            >
                              {day.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <FormField
                      label="Date of accident"
                      error={errors.formData?.dayOfAccident?.date?.message}
                      required
                    >
                      <input
                        type="date"
                        {...register("formData.dayOfAccident.date")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                      />
                    </FormField>
                  </div>

                  <div className="mt-4">
                    <p className="font-medium mb-2">This report is made by:</p>
                    <div className="flex flex-wrap gap-4">
                      {reportMadeByOptions.map((option) => (
                        <div key={option.value} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`report-by-${option.value}`}
                            {...register(
                              `formData.reportMadeBy.${option.value}` as any
                            )}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={`report-by-${option.value}`}
                            className="ml-1 text-sm text-gray-700"
                          >
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                      label="First reported to"
                      error={errors.formData?.firstReportedTo?.message}
                    >
                      <input
                        {...register("formData.firstReportedTo")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                      />
                    </FormField>

                    <FormField
                      label="Date first reported"
                      error={errors.formData?.dateFirstReported?.message}
                    >
                      <input
                        type="date"
                        {...register("formData.dateFirstReported")}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                      />
                    </FormField>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h2 className="text-xl font-medium text-gray-700 mb-4">
                  Step 1: Personal Information - Injured Employee
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Name"
                    error={errors.formData?.personalInfo?.name?.message}
                    required
                  >
                    <input
                      {...register("formData.personalInfo.name")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <div>
                    <label className="block text-gray-700 mb-1">Sex</label>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="male"
                          value="Male"
                          {...register("formData.personalInfo.sex")}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="male"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Male
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="female"
                          value="Female"
                          {...register("formData.personalInfo.sex")}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="female"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Female
                        </label>
                      </div>
                    </div>
                  </div>

                  <FormField
                    label="Age"
                    error={errors.formData?.personalInfo?.age?.message}
                  >
                    <input
                      type="number"
                      min="0"
                      {...register("formData.personalInfo.age")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    label="Employed By"
                    error={errors.formData?.personalInfo?.employedBy?.message}
                    required
                  >
                    <input
                      {...register("formData.personalInfo.employedBy")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <FormField
                    label="Job title and tasks at time of accident"
                    error={errors.formData?.personalInfo?.jobTitle?.message}
                    required
                  >
                    <input
                      {...register("formData.personalInfo.jobTitle")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                  <div>
                    <div className="grid grid-cols-1 gap-8 mt-6">
                      <BodyDiagram />
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <p className="font-medium mb-2">
                        Nature of injury (most serious one):
                      </p>
                      <CheckboxesGroup
                        options={natureOfInjuryOptions}
                        basePath="formData.personalInfo.natureOfInjury"
                        register={register}
                        otherPath="formData.personalInfo.natureOfInjury.otherDescription"
                        otherRegister={register}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="font-medium mb-2">This employee works:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {employeeWorkTypeOptions.map((option) => {
                        const fieldName = `formData.personalInfo.employeeWorks.${option.value}`;
                        return (
                          <div key={option.value} className="flex items-center">
                            <input
                              type="checkbox"
                              id={fieldName}
                              {...register(
                                fieldName as keyof AccidentReportForm
                              )}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                              htmlFor={fieldName}
                              className="ml-2 block text-sm text-gray-700"
                            >
                              {option.label}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <FormField
                    label="Superintendent/Supervisor Name"
                    error={
                      errors.formData?.personalInfo?.superintendentName?.message
                    }
                  >
                    <input
                      {...register("formData.personalInfo.superintendentName")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    label="Was this person trained to perform this activity?"
                    error={
                      errors.formData?.personalInfo?.wasPersonTrained?.message
                    }
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="trained-yes"
                          value="Yes"
                          {...register(
                            "formData.personalInfo.wasPersonTrained"
                          )}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="trained-yes"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="trained-no"
                          value="No"
                          {...register(
                            "formData.personalInfo.wasPersonTrained"
                          )}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="trained-no"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          No
                        </label>
                      </div>
                    </div>
                  </FormField>

                  <FormField
                    label="What type of training was received (OTJ, classroom, etc)?"
                    error={errors.formData?.personalInfo?.trainingType?.message}
                  >
                    <input
                      {...register("formData.personalInfo.trainingType")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("step2")}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-100"
                >
                  Next: Witness Information
                </button>
              </div>
            </TabsContent>

            {/* Step 2: Witness Information */}
            <TabsContent value="step2" className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h2 className="text-xl font-medium text-gray-700 mb-4">
                  Step 2: Witness Information
                </h2>

                {witnessFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="mb-6 p-4 border border-gray-200 rounded-md"
                  >
                    <h3 className="font-medium text-gray-700 mb-2">
                      Witness #{index + 1}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Name"
                        error={
                          errors.formData?.witnessInfo?.[index]?.name?.message
                        }
                      >
                        <input
                          {...register(`formData.witnessInfo.${index}.name`)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        />
                      </FormField>

                      <FormField
                        label="Job Title/Description"
                        error={
                          errors.formData?.witnessInfo?.[index]?.jobTitle
                            ?.message
                        }
                      >
                        <input
                          {...register(
                            `formData.witnessInfo.${index}.jobTitle`
                          )}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        />
                      </FormField>

                      <FormField
                        label="Employed By"
                        error={
                          errors.formData?.witnessInfo?.[index]?.employedBy
                            ?.message
                        }
                      >
                        <input
                          {...register(
                            `formData.witnessInfo.${index}.employedBy`
                          )}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        />
                      </FormField>

                      <FormField
                        label="Superintendent/Supervisor Name"
                        error={
                          errors.formData?.witnessInfo?.[index]?.supervisorName
                            ?.message
                        }
                      >
                        <input
                          {...register(
                            `formData.witnessInfo.${index}.supervisorName`
                          )}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        />
                      </FormField>
                    </div>
                    {index >= 2 && (
                      <button
                        type="button"
                        onClick={() => removeWitness(index)}
                        className="mt-2 text-red-600 hover:text-red-800"
                      >
                        Remove Witness
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => appendWitness({})}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  + Add another witness
                </button>

                <div className="mt-4">
                  <FormField
                    label="Was the site secured and witness statements taken immediately?"
                    error={errors.formData?.siteSecured?.message}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="secured-yes"
                          value="Yes"
                          {...register("formData.siteSecured")}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="secured-yes"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="secured-no"
                          value="No"
                          {...register("formData.siteSecured")}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="secured-no"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          No
                        </label>
                      </div>
                    </div>
                  </FormField>

                  <FormField
                    label="By Whom?"
                    error={errors.formData?.securedBy?.message}
                  >
                    <input
                      {...register("formData.securedBy")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("step1")}
                  className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-100"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("step3")}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-100"
                >
                  Next: Accident Description
                </button>
              </div>
            </TabsContent>

            {/* Step 3: Accident Description */}
            <TabsContent value="step3" className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h2 className="text-xl font-medium text-gray-700 mb-4">
                  Step 3: Accident Description
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Exact location of the accident"
                    error={
                      errors.formData?.accidentDescription?.exactLocation
                        ?.message
                    }
                    required
                  >
                    <input
                      {...register(
                        "formData.accidentDescription.exactLocation"
                      )}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <FormField
                    label="Job Name & Number"
                    error={
                      errors.formData?.accidentDescription?.jobNameNumber
                        ?.message
                    }
                    required
                  >
                    <input
                      {...register(
                        "formData.accidentDescription.jobNameNumber"
                      )}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <FormField
                    label="Exact time"
                    error={
                      errors.formData?.accidentDescription?.exactTime?.message
                    }
                    required
                  >
                    <input
                      type="time"
                      {...register("formData.accidentDescription.exactTime")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>
                </div>

                <div className="mt-4">
                  <p className="font-medium mb-2">
                    What part of employee's workday?
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {workdayPartOptions.map((option) => {
                      const fieldName = `formData.accidentDescription.workdayPart.${option.value}`;
                      return (
                        <div key={option.value} className="flex items-center">
                          <input
                            type="checkbox"
                            id={fieldName}
                            {...register(fieldName as keyof AccidentReportForm)}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label
                            htmlFor={fieldName}
                            className="ml-2 block text-sm text-gray-700"
                          >
                            {option.label}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <FormField
                    label="Describe the accident in detail"
                    error={
                      errors.formData?.accidentDescription?.description?.message
                    }
                    required
                  >
                    <textarea
                      {...register("formData.accidentDescription.description")}
                      rows={8}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    ></textarea>
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField
                    label="Type of construction equipment involved?"
                    error={
                      errors.formData?.accidentDescription?.equipmentInvolved
                        ?.message
                    }
                  >
                    <textarea
                      {...register(
                        "formData.accidentDescription.equipmentInvolved"
                      )}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    ></textarea>
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField
                    label="What type of PPE was being used?"
                    error={
                      errors.formData?.accidentDescription?.ppeUsed?.message
                    }
                  >
                    <textarea
                      {...register("formData.accidentDescription.ppeUsed")}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    ></textarea>
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField
                    label="What was the direct cause of the accident?"
                    error={
                      errors.formData?.accidentDescription?.directCause?.message
                    }
                    required
                  >
                    <textarea
                      {...register("formData.accidentDescription.directCause")}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    ></textarea>
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField
                    label="What was the indirect cause of the accident?"
                    error={
                      errors.formData?.accidentDescription?.indirectCause
                        ?.message
                    }
                  >
                    <textarea
                      {...register(
                        "formData.accidentDescription.indirectCause"
                      )}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    ></textarea>
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField
                    label="Actions taken to prevent re-occurrence"
                    error={
                      errors.formData?.accidentDescription?.preventionActions
                        ?.message
                    }
                    required
                  >
                    <textarea
                      {...register(
                        "formData.accidentDescription.preventionActions"
                      )}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    ></textarea>
                  </FormField>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("step2")}
                  className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-100"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("step4")}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-100"
                >
                  Next: Why did the accident happen?
                </button>
              </div>
            </TabsContent>
            {/* Step 4: Why did the accident happen? */}
            <TabsContent value="step4" className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h2 className="text-xl font-medium text-gray-700 mb-4">
                  Step 4: Why did the accident happen?
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-medium mb-2">
                      Unsafe workplace conditions (check all that apply)
                    </p>
                    <CheckboxesGroup
                      options={unsafeWorkplaceConditionsOptions}
                      basePath="formData.accidentCauses.unsafeConditions"
                      register={register}
                      otherPath="formData.accidentCauses.unsafeConditions.otherDescription"
                      otherRegister={register}
                    />
                  </div>

                  <div>
                    <p className="font-medium mb-2">
                      Unsafe acts by people (check all that apply)
                    </p>
                    <CheckboxesGroup
                      options={unsafeActsOptions}
                      basePath="formData.accidentCauses.unsafeActs"
                      register={register}
                      otherPath="formData.accidentCauses.unsafeActs.otherDescription"
                      otherRegister={register}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <FormField
                    label="Why did the unsafe conditions exist?"
                    error={
                      errors.formData?.accidentCauses?.whyUnsafeConditions
                        ?.message
                    }
                  >
                    <textarea
                      {...register(
                        "formData.accidentCauses.whyUnsafeConditions"
                      )}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    ></textarea>
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField
                    label="Why did the unsafe acts occur?"
                    error={
                      errors.formData?.accidentCauses?.whyUnsafeActs?.message
                    }
                  >
                    <textarea
                      {...register("formData.accidentCauses.whyUnsafeActs")}
                      rows={5}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    ></textarea>
                  </FormField>
                </div>

                <div className="mt-4">
                  <FormField
                    label='Is there a reward (such as "the job can be done more quickly" or "the product is less likely to be damaged") that may have encouraged the unsafe conditions or acts?'
                    error={
                      errors.formData?.accidentCauses?.rewardForUnsafeActs
                        ?.message
                    }
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="reward-yes"
                          value="Yes"
                          {...register(
                            "formData.accidentCauses.rewardForUnsafeActs"
                          )}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="reward-yes"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="reward-no"
                          value="No"
                          {...register(
                            "formData.accidentCauses.rewardForUnsafeActs"
                          )}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="reward-no"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          No
                        </label>
                      </div>
                    </div>
                  </FormField>

                  {watch("formData.accidentCauses.rewardForUnsafeActs") ===
                    "Yes" && (
                    <div className="mt-2">
                      <FormField
                        label="If 'Yes,' describe"
                        error={
                          errors.formData?.accidentCauses?.rewardDescription
                            ?.message
                        }
                      >
                        <textarea
                          {...register(
                            "formData.accidentCauses.rewardDescription"
                          )}
                          rows={3}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                        ></textarea>
                      </FormField>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <FormField
                    label="Were the unsafe acts or conditions reported prior to the accident?"
                    error={
                      errors.formData?.accidentCauses?.unsafeActsReportedPrior
                        ?.message
                    }
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="reported-yes"
                          value="Yes"
                          {...register(
                            "formData.accidentCauses.unsafeActsReportedPrior"
                          )}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="reported-yes"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="reported-no"
                          value="No"
                          {...register(
                            "formData.accidentCauses.unsafeActsReportedPrior"
                          )}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="reported-no"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          No
                        </label>
                      </div>
                    </div>
                  </FormField>

                  <div className="mt-2">
                    <FormField
                      label="Explain"
                      error={
                        errors.formData?.accidentCauses
                          ?.unsafeActsReportedExplanation?.message
                      }
                    >
                      <textarea
                        {...register(
                          "formData.accidentCauses.unsafeActsReportedExplanation"
                        )}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                      ></textarea>
                    </FormField>
                  </div>
                </div>

                <div className="mt-4">
                  <FormField
                    label="Have there been similar accidents or near misses prior to the accident?"
                    error={
                      errors.formData?.accidentCauses?.similarAccidentsPrior
                        ?.message
                    }
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="similar-yes"
                          value="Yes"
                          {...register(
                            "formData.accidentCauses.similarAccidentsPrior"
                          )}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="similar-yes"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          Yes
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="similar-no"
                          value="No"
                          {...register(
                            "formData.accidentCauses.similarAccidentsPrior"
                          )}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                        />
                        <label
                          htmlFor="similar-no"
                          className="ml-2 block text-sm text-gray-700"
                        >
                          No
                        </label>
                      </div>
                    </div>
                  </FormField>

                  <div className="mt-2">
                    <FormField
                      label="Description"
                      error={
                        errors.formData?.accidentCauses
                          ?.similarAccidentsDescription?.message
                      }
                    >
                      <textarea
                        {...register(
                          "formData.accidentCauses.similarAccidentsDescription"
                        )}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                      ></textarea>
                    </FormField>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("step3")}
                  className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-100"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("step5")}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-100"
                >
                  Next: OSHA Information
                </button>
              </div>
            </TabsContent>
            {/* Step 5: OSHA Information */}
            <TabsContent value="step5" className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h2 className="text-xl font-medium text-gray-700 mb-4">
                  Step 5: OSHA Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Date OSHA was Notified"
                    error={errors.formData?.oshaInfo?.dateNotified?.message}
                  >
                    <input
                      type="date"
                      {...register("formData.oshaInfo.dateNotified")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <FormField
                    label="Dates of Investigation"
                    error={
                      errors.formData?.oshaInfo?.investigationDates?.message
                    }
                  >
                    <input
                      {...register("formData.oshaInfo.investigationDates")}
                      placeholder="e.g., 01/15/2023 - 01/20/2023"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <FormField
                    label="Date of Citation (if applicable)"
                    error={errors.formData?.oshaInfo?.citationDate?.message}
                  >
                    <input
                      type="date"
                      {...register("formData.oshaInfo.citationDate")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <FormField
                    label="Dollar Amount of Penalties (if applicable)"
                    error={errors.formData?.oshaInfo?.penaltyAmount?.message}
                  >
                    <input
                      {...register("formData.oshaInfo.penaltyAmount")}
                      placeholder="e.g., $5,000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("step4")}
                  className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-100"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("step6")}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-100"
                >
                  Next: Report Preparer
                </button>
              </div>
            </TabsContent>

            {/* Step 6: Report Preparer */}
            <TabsContent value="step6" className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <h2 className="text-xl font-medium text-gray-700 mb-4">
                  Step 6: Report Preparer
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    label="Name"
                    error={errors.formData?.reportPreparer?.name?.message}
                    required
                  >
                    <input
                      {...register("formData.reportPreparer.name")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <FormField
                    label="Date of Report"
                    error={
                      errors.formData?.reportPreparer?.dateOfReport?.message
                    }
                    required
                  >
                    <input
                      type="date"
                      {...register("formData.reportPreparer.dateOfReport")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <FormField
                    label="Title"
                    error={errors.formData?.reportPreparer?.title?.message}
                  >
                    <input
                      {...register("formData.reportPreparer.title")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <FormField
                    label="Employer"
                    error={errors.formData?.reportPreparer?.employer?.message}
                  >
                    <input
                      {...register("formData.reportPreparer.employer")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>

                  <FormField
                    label="Phone Number"
                    error={
                      errors.formData?.reportPreparer?.phoneNumber?.message
                    }
                  >
                    <input
                      {...register("formData.reportPreparer.phoneNumber")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                    />
                  </FormField>
                </div>

                {/* PDF Generation Option */}
                {(!id || id === "new") && (
                  <div className="mt-6">
                    <FormField label="">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="generatePDF"
                          {...register("formData.generatePDF")}
                          className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="generatePDF" className="text-gray-700">
                          Generate PDF for this Accident/Incident Report
                        </label>
                      </div>
                    </FormField>
                  </div>
                )}
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("step5")}
                  className="bg-gray-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-gray-600 focus:outline-none focus:ring focus:ring-gray-100"
                >
                  Previous
                </button>

                <div className="flex space-x-4">
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
              </div>
            </TabsContent>

            {/* Tips Tab */}
            <TabsContent value="tips" className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-md mb-6">
                <h2 className="text-xl font-medium text-gray-700 mb-4">
                  Tips for Accident/Incident Investigations
                </h2>

                <ol className="list-decimal pl-6 space-y-4">
                  <li>
                    <p className="text-gray-700">
                      <strong>
                        Talk with the injured person and witnesses at the scene,
                        if possible.
                      </strong>{" "}
                      The longer you wait to investigate, the more the scene
                      will change, the more evidence will disappear, and the
                      more people's memories will fade.
                    </p>
                  </li>

                  <li>
                    <p className="text-gray-700">
                      <strong>Act professionally.</strong> Show concern for the
                      employee's injury, no matter how minor it is. Avoid
                      sarcasm, blame, and threats. Don't make up your mind about
                      what happened, or whose fault it was, before the
                      investigation is complete.
                    </p>
                  </li>

                  <li>
                    <p className="text-gray-700">
                      <strong>
                        Explain why the investigation is necessary.
                      </strong>{" "}
                      Reassure everyone involved that accident investigations
                      are for fact-finding, not fault-finding.
                      <ul className="list-disc pl-6 mt-2">
                        <li>
                          We need to know what happened, so we can try to
                          prevent it from happening again.
                        </li>
                        <li>
                          The insurance company needs to know what happened, so
                          they know what to do with the claim.
                        </li>
                      </ul>
                    </p>
                  </li>

                  <li>
                    <p className="text-gray-700">
                      <strong>
                        Get the story before asking your own questions.
                      </strong>{" "}
                      Listen carefully. Avoid interruptions.
                    </p>
                  </li>

                  <li>
                    <p className="text-gray-700">
                      <strong>Check your understanding of the story.</strong>{" "}
                      Use tact in clearing up discrepancies.
                    </p>
                  </li>

                  <li>
                    <p className="text-gray-700">
                      <strong>
                        Encourage people to give their ideas for preventing a
                        similar event.
                      </strong>{" "}
                      Discuss possible solutions/corrective action(s). Study
                      possible causes: unsafe acts, unsafe conditions, procedure
                      deficiencies, system deficiencies (i.e. Using an unsafe
                      tool/cord is an unsafe act; however, the system used for
                      tool repair/requisition should be examined to see if it
                      contributed to the situation). Look for ROOT causes.
                    </p>
                  </li>

                  <li>
                    <p className="text-gray-700">
                      <strong>
                        Write your accident report giving a complete, accurate
                        account of the event.
                      </strong>{" "}
                      Document facts. If you absolutely must document opinions,
                      make sure to clearly identify them as opinions.
                    </p>
                  </li>

                  <li>
                    <p className="text-gray-700">
                      <strong>
                        Submit your report to the Safety Team IMMEDIATELY!
                      </strong>{" "}
                      The later we are in reporting the claim to the insurance
                      company, the more expensive the claim is going to be. Why
                      is this important? Because more expensive claims mean:
                      <ul className="list-disc pl-6 mt-2">
                        <li>
                          A higher EMR, which makes it harder to get projects.
                        </li>
                        <li>
                          A higher cost for the company to pay for insurance
                          coverage.
                        </li>
                        <li>
                          Ultimately, money coming directly out of all of our
                          own bonuses.
                        </li>
                      </ul>
                    </p>
                  </li>

                  <li>
                    <p className="text-gray-700">
                      <strong>Don't forget:</strong> this process isn't over
                      once the report has been submitted. Follow-up to make sure
                      conditions are corrected.
                    </p>
                  </li>
                </ol>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab("step1")}
                  className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-100"
                >
                  Back to Form
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </form>
      </FormProvider>
    </div>
  );
}
