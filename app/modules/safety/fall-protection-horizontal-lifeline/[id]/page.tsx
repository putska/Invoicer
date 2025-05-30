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

const fallProtectionInspectionSchema = z.object({
  formName: z.string().default("Fall-Protection-Horizontal-Lifeline"),
  pdfName: z.string().default("FallProtectionHorizontalLifeline.pdf"),
  userName: z.string().min(1, "User name is required"),
  jobName: z.string().min(1, "Job name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  formData: z.object({
    jobNumber: z.string().optional(),

    // Equipment Information
    manufacturer: z.string().optional(),
    dateOfManufacture: z.string().optional(),
    serialNumber: z.string().optional(),
    modelNumber: z.string().optional(),

    // Lifeline Material
    lifelineMaterial: z
      .object({
        cable: z.boolean().default(false),
        polyester: z.boolean().default(false),
        kernmantle: z.boolean().default(false),
      })
      .default({}),

    length: z.string().optional(),
    diameter: z.string().optional(),

    // Inspection Details
    inspectionDate: z.string().min(1, "Inspection date is required"),
    inServiceDate: z.string().optional(),
    nameOfUser: z
      .string()
      .min(1, "Name of user (authorized person) is required"),
    nameOfCompetentPerson: z
      .string()
      .min(1, "Name of competent person is required"),

    // Labels & Markings Section
    labelsMarkings: z
      .object({
        labelLegible: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        appropriateMarkings: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        dateOfFirstUse: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        inspectionsCurrent: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
      })
      .default({}),

    // Hardware Section
    hardware: z
      .object({
        connector: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        hookGate: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        corrosion: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        pitting: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
      })
      .default({}),

    // Material Section
    material: z
      .object({
        properLifelineThreading: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        brokenStitching: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        termination: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        kinks: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        cuts: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        separating: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        excessiveWear: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
      })
      .default({}),

    // Shock Pack Section
    shockPack: z
      .object({
        coverShrinkTube: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        damageFraying: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
        impactIndicator: z
          .object({
            status: z
              .enum(["pass", "fail", "not_checked"])
              .default("not_checked"),
            note: z.string().optional(),
          })
          .default({}),
      })
      .default({}),

    // Additional Notes
    additionalNotes: z.string().optional(),

    generatePDF: z.boolean().default(false),
  }),
});

type FallProtectionInspectionForm = z.infer<
  typeof fallProtectionInspectionSchema
>;

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

interface InspectionItemProps {
  label: string;
  fieldPath: string;
  register: any;
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

const InspectionItem = ({
  label,
  fieldPath,
  register,
}: InspectionItemProps) => (
  <tr>
    <td className="px-4 py-2 border text-left">{label}</td>
    <td className="px-4 py-2 border text-center">
      <input
        type="radio"
        value="pass"
        {...register(`${fieldPath}.status`)}
        className="text-green-600"
      />
    </td>
    <td className="px-4 py-2 border text-center">
      <input
        type="radio"
        value="fail"
        {...register(`${fieldPath}.status`)}
        className="text-red-600"
      />
    </td>
    <td className="px-4 py-2 border">
      <input
        {...register(`${fieldPath}.note`)}
        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
        placeholder="Notes"
      />
    </td>
  </tr>
);

// ---------------- Main Component ----------------

export default function FallProtectionInspectionPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<FallProtectionInspectionForm>({
    resolver: zodResolver(fallProtectionInspectionSchema),
    defaultValues: {
      formName: "Fall-Protection-Horizontal-Lifeline",
      pdfName: "FallProtectionHorizontalLifeline.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "",
      jobName: "",
      formData: {
        jobNumber: "",
        manufacturer: "",
        dateOfManufacture: "",
        serialNumber: "",
        modelNumber: "",
        lifelineMaterial: {
          cable: false,
          polyester: false,
          kernmantle: false,
        },
        length: "",
        diameter: "",
        inspectionDate: new Date().toISOString().split("T")[0],
        inServiceDate: "",
        nameOfUser: "",
        nameOfCompetentPerson: "",
        labelsMarkings: {
          labelLegible: { status: "not_checked", note: "" },
          appropriateMarkings: { status: "not_checked", note: "" },
          dateOfFirstUse: { status: "not_checked", note: "" },
          inspectionsCurrent: { status: "not_checked", note: "" },
        },
        hardware: {
          connector: { status: "not_checked", note: "" },
          hookGate: { status: "not_checked", note: "" },
          corrosion: { status: "not_checked", note: "" },
          pitting: { status: "not_checked", note: "" },
        },
        material: {
          properLifelineThreading: { status: "not_checked", note: "" },
          brokenStitching: { status: "not_checked", note: "" },
          termination: { status: "not_checked", note: "" },
          kinks: { status: "not_checked", note: "" },
          cuts: { status: "not_checked", note: "" },
          separating: { status: "not_checked", note: "" },
          excessiveWear: { status: "not_checked", note: "" },
        },
        shockPack: {
          coverShrinkTube: { status: "not_checked", note: "" },
          damageFraying: { status: "not_checked", note: "" },
          impactIndicator: { status: "not_checked", note: "" },
        },
        additionalNotes: "",
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
    async (data: FallProtectionInspectionForm) => {
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

  const loadFallProtectionInspection = useCallback(
    async (formId: string) => {
      try {
        const response = await fetch(`/api/safety/${formId}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        console.log("Fall Protection Inspection API response:", result);

        if (!result.submission) {
          throw new Error(result.error || "Invalid response structure");
        }

        const form = result.submission;

        // Verify this is actually a fall protection inspection
        if (form.formName !== "Fall-Protection-Horizontal-Lifeline") {
          throw new Error(
            "This form is not a fall protection horizontal lifeline "
          );
        }

        // Format dates and reset form values
        reset({
          ...form,
          dateCreated: format(new Date(form.dateCreated), "yyyy-MM-dd"),
          formData: {
            ...form.formData,
            inspectionDate: form.formData.inspectionDate
              ? format(new Date(form.formData.inspectionDate), "yyyy-MM-dd")
              : "",
            inServiceDate: form.formData.inServiceDate
              ? format(new Date(form.formData.inServiceDate), "yyyy-MM-dd")
              : "",
            dateOfManufacture: form.formData.dateOfManufacture
              ? format(new Date(form.formData.dateOfManufacture), "yyyy-MM-dd")
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
          await loadFallProtectionInspection(id);
        } else {
          setStatus("success");
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [id, loadFallProtectionInspection, loadJobs]);

  // ---------------- Form Submission ----------------

  const onSubmit = async (formData: FallProtectionInspectionForm) => {
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
          ? "Edit Fall Protection Inspection"
          : "New Fall Protection Inspection"}
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

          {/* Equipment Information */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Equipment Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Manufacturer"
                error={errors.formData?.manufacturer?.message}
              >
                <input
                  {...register("formData.manufacturer")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Date of Manufacture"
                error={errors.formData?.dateOfManufacture?.message}
              >
                <input
                  type="date"
                  {...register("formData.dateOfManufacture")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Serial #"
                error={errors.formData?.serialNumber?.message}
              >
                <input
                  {...register("formData.serialNumber")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Model #"
                error={errors.formData?.modelNumber?.message}
              >
                <input
                  {...register("formData.modelNumber")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Length"
                error={errors.formData?.length?.message}
              >
                <input
                  {...register("formData.length")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  placeholder="e.g., 50 ft"
                />
              </FormField>

              <FormField
                label="Diameter"
                error={errors.formData?.diameter?.message}
              >
                <input
                  {...register("formData.diameter")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                  placeholder="e.g., 1/2 inch"
                />
              </FormField>
            </div>

            {/* Lifeline Material */}
            <FormField label="Lifeline Material">
              <div className="flex space-x-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="cable"
                    {...register("formData.lifelineMaterial.cable")}
                    className="mr-2"
                  />
                  <label htmlFor="cable" className="text-gray-700">
                    Cable
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="polyester"
                    {...register("formData.lifelineMaterial.polyester")}
                    className="mr-2"
                  />
                  <label htmlFor="polyester" className="text-gray-700">
                    Polyester
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="kernmantle"
                    {...register("formData.lifelineMaterial.kernmantle")}
                    className="mr-2"
                  />
                  <label htmlFor="kernmantle" className="text-gray-700">
                    Kernmantle
                  </label>
                </div>
              </div>
            </FormField>
          </div>

          {/* Inspection Details */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Inspection Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Inspection Date"
                error={errors.formData?.inspectionDate?.message}
                required
              >
                <input
                  type="date"
                  {...register("formData.inspectionDate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="In-Service Date"
                error={errors.formData?.inServiceDate?.message}
              >
                <input
                  type="date"
                  {...register("formData.inServiceDate")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Name of User (Authorized Person)"
                error={errors.formData?.nameOfUser?.message}
                required
              >
                <input
                  {...register("formData.nameOfUser")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Name of Competent Person"
                error={errors.formData?.nameOfCompetentPerson?.message}
                required
              >
                <input
                  {...register("formData.nameOfCompetentPerson")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>
          </div>

          {/* Labels & Markings Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Labels & Markings
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border bg-gray-100 text-left">
                      Item
                    </th>
                    <th className="px-4 py-2 border bg-green-100 text-center">
                      PASS
                    </th>
                    <th className="px-4 py-2 border bg-red-100 text-center">
                      FAIL
                    </th>
                    <th className="px-4 py-2 border bg-blue-100 text-center">
                      NOTE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <InspectionItem
                    label="Label (legible/intact)"
                    fieldPath="formData.labelsMarkings.labelLegible"
                    register={register}
                  />
                  <InspectionItem
                    label="Appropriate (ANSI/OSHA) Markings"
                    fieldPath="formData.labelsMarkings.appropriateMarkings"
                    register={register}
                  />
                  <InspectionItem
                    label="Date of First Use"
                    fieldPath="formData.labelsMarkings.dateOfFirstUse"
                    register={register}
                  />
                  <InspectionItem
                    label="Inspections Current / Up to Date"
                    fieldPath="formData.labelsMarkings.inspectionsCurrent"
                    register={register}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* Hardware Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">Hardware</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border bg-gray-100 text-left">
                      Item
                    </th>
                    <th className="px-4 py-2 border bg-green-100 text-center">
                      PASS
                    </th>
                    <th className="px-4 py-2 border bg-red-100 text-center">
                      FAIL
                    </th>
                    <th className="px-4 py-2 border bg-blue-100 text-center">
                      NOTE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <InspectionItem
                    label="Connector (self closing & locking)"
                    fieldPath="formData.hardware.connector"
                    register={register}
                  />
                  <InspectionItem
                    label="Hook Gate / Tensioner / Rivets"
                    fieldPath="formData.hardware.hookGate"
                    register={register}
                  />
                  <InspectionItem
                    label="Corrosion"
                    fieldPath="formData.hardware.corrosion"
                    register={register}
                  />
                  <InspectionItem
                    label="Pitting / Nicks"
                    fieldPath="formData.hardware.pitting"
                    register={register}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* Material Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Material (Web or Cable)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border bg-gray-100 text-left">
                      Item
                    </th>
                    <th className="px-4 py-2 border bg-green-100 text-center">
                      PASS
                    </th>
                    <th className="px-4 py-2 border bg-red-100 text-center">
                      FAIL
                    </th>
                    <th className="px-4 py-2 border bg-blue-100 text-center">
                      NOTE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <InspectionItem
                    label="Confirm Proper Lifeline Threading"
                    fieldPath="formData.material.properLifelineThreading"
                    register={register}
                  />
                  <InspectionItem
                    label="Broken / Missing / Loose Stitching"
                    fieldPath="formData.material.brokenStitching"
                    register={register}
                  />
                  <InspectionItem
                    label="Termination (Stitch, Splice or Swag)"
                    fieldPath="formData.material.termination"
                    register={register}
                  />
                  <InspectionItem
                    label="Kinks"
                    fieldPath="formData.material.kinks"
                    register={register}
                  />
                  <InspectionItem
                    label="Cuts / Burns / Holes"
                    fieldPath="formData.material.cuts"
                    register={register}
                  />
                  <InspectionItem
                    label="Separating / Bird-Caging"
                    fieldPath="formData.material.separating"
                    register={register}
                  />
                  <InspectionItem
                    label="Excessive Wear (Fraying or Broken Strands)"
                    fieldPath="formData.material.excessiveWear"
                    register={register}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* Shock Pack Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Shock Pack (if present)
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-4 py-2 border bg-gray-100 text-left">
                      Item
                    </th>
                    <th className="px-4 py-2 border bg-green-100 text-center">
                      PASS
                    </th>
                    <th className="px-4 py-2 border bg-red-100 text-center">
                      FAIL
                    </th>
                    <th className="px-4 py-2 border bg-blue-100 text-center">
                      NOTE
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <InspectionItem
                    label="Cover / Shrink Tube (Don't cut or remove)"
                    fieldPath="formData.shockPack.coverShrinkTube"
                    register={register}
                  />
                  <InspectionItem
                    label="Damage / Fraying / Broken Stitching"
                    fieldPath="formData.shockPack.damageFraying"
                    register={register}
                  />
                  <InspectionItem
                    label="Impact Indicator (Signs of Deployment)"
                    fieldPath="formData.shockPack.impactIndicator"
                    register={register}
                  />
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Additional Notes
            </h2>

            <FormField
              label="Additional Notes"
              error={errors.formData?.additionalNotes?.message}
            >
              <textarea
                {...register("formData.additionalNotes")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={4}
                placeholder="Enter any additional notes or observations"
              />
            </FormField>
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
                  Generate PDF for this Fall Protection Inspection
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
