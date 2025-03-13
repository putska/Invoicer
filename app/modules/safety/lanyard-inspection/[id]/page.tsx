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

const lanyardInspectionSchema = z.object({
  formName: z.string().default("Lanyard Inspection Form"),
  pdfName: z.string().default("LanyardInspection.pdf"),
  userName: z.string().min(1, "User name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  formData: z.object({
    manufacturer: z.string().min(1, "Manufacturer is required"),
    dateOfManufacture: z.string().min(1, "Date of manufacture is required"),
    serialNumber: z.string().min(1, "Serial number is required"),
    modelNumber: z.string().min(1, "Model number is required"),
    typeMaterial: z.string().min(1, "Type of lanyard & material is required"),
    inspectionDate: z.string().min(1, "Inspection date is required"),
    inServiceDate: z.string().optional(),
    authorizedPerson: z.string().min(1, "Authorized person is required"),
    competentPerson: z.string().min(1, "Competent person is required"),

    // Labels & Markings
    labelsAndMarkings: z.object({
      label: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      markings: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      dateOfFirstUse: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      inspectionsCurrent: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
    }),

    // Connectors
    connectors: z.object({
      connector: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      hookGateRivets: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      corrosion: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      pittingNicks: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
    }),

    // Material (Web or Cable)
    material: z.object({
      brokenStitching: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      termination: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      webbingLength: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      cutsBurns: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      cableSeparating: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
    }),

    // Shock Pack
    shockPack: z.object({
      coverShrinkTube: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      damageFraying: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      impactIndicator: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
    }),

    additionalNotes: z.string().optional(),
    generatePDF: z.boolean().default(false),
  }),
});

type LanyardInspectionForm = z.infer<typeof lanyardInspectionSchema>;

interface FormFieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}

interface CheckboxFieldProps {
  label: string;
  passName: string;
  failName: string;
  noteName: string;
  register: any;
  errors?: any;
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

const CheckboxField = ({
  label,
  passName,
  failName,
  noteName,
  register,
  errors,
}: CheckboxFieldProps) => {
  // Get the setValue function from useForm context
  const { setValue, watch } = useFormContext();

  // Watch the current values
  const passValue = watch(passName);
  const failValue = watch(failName);

  // Handle radio-like behavior when Pass is clicked
  const handlePassClick = () => {
    setValue(passName, true);
    setValue(failName, false);
  };

  // Handle radio-like behavior when Fail is clicked
  const handleFailClick = () => {
    setValue(passName, false);
    setValue(failName, true);
  };

  return (
    <div className="grid grid-cols-12 gap-2 items-center mb-2 py-2 border-b border-gray-100">
      <div className="col-span-4">{label}</div>
      <div className="col-span-2 flex items-center justify-center">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={passName}
            {...register(passName)}
            checked={passValue}
            onChange={handlePassClick}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label
            htmlFor={passName}
            className="ml-1 block text-sm text-gray-700"
          >
            PASS
          </label>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-center">
        <div className="flex items-center">
          <input
            type="checkbox"
            id={failName}
            {...register(failName)}
            checked={failValue}
            onChange={handleFailClick}
            className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
          />
          <label
            htmlFor={failName}
            className="ml-1 block text-sm text-gray-700"
          >
            FAIL
          </label>
        </div>
      </div>
      <div className="col-span-4">
        <input
          type="text"
          {...register(noteName)}
          placeholder="Notes"
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
        />
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
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<LanyardInspectionForm>({
    resolver: zodResolver(lanyardInspectionSchema),
    defaultValues: {
      formName: "Lanyard-Inspection",
      pdfName: "LanyardInspection.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "Stephen Watts",
      formData: {
        manufacturer: "",
        dateOfManufacture: "",
        serialNumber: "",
        modelNumber: "",
        typeMaterial: "",
        inspectionDate: new Date().toISOString().split("T")[0],
        inServiceDate: "",
        authorizedPerson: fullName || "",
        competentPerson: fullName || "",
        labelsAndMarkings: {
          label: { pass: false, fail: false, note: "" },
          markings: { pass: false, fail: false, note: "" },
          dateOfFirstUse: { pass: false, fail: false, note: "" },
          inspectionsCurrent: { pass: false, fail: false, note: "" },
        },
        connectors: {
          connector: { pass: false, fail: false, note: "" },
          hookGateRivets: { pass: false, fail: false, note: "" },
          corrosion: { pass: false, fail: false, note: "" },
          pittingNicks: { pass: false, fail: false, note: "" },
        },
        material: {
          brokenStitching: { pass: false, fail: false, note: "" },
          termination: { pass: false, fail: false, note: "" },
          webbingLength: { pass: false, fail: false, note: "" },
          cutsBurns: { pass: false, fail: false, note: "" },
          cableSeparating: { pass: false, fail: false, note: "" },
        },
        shockPack: {
          coverShrinkTube: { pass: false, fail: false, note: "" },
          damageFraying: { pass: false, fail: false, note: "" },
          impactIndicator: { pass: false, fail: false, note: "" },
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
  } = methods;

  // ---------------- Debounced Auto-Save ----------------

  // Watch form values so we can auto-save drafts for existing records
  const watchedValues = useWatch({ control });

  const saveDraft = useCallback(
    async (data: LanyardInspectionForm) => {
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
      setValue("formData.authorizedPerson", fullName);
      setValue("formData.competentPerson", fullName);
      setValue("userName", fullName); // Add this line to update the userName field
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

  const onSubmit = async (formData: LanyardInspectionForm) => {
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
          ? "Edit Fall Protection Lanyard Inspection"
          : "New Fall Protection Lanyard Inspection"}
      </h1>
      <FormProvider {...methods}>
        <form
          onSubmit={handleSubmit(onSubmit, (errors) =>
            console.error("Validation errors:", errors)
          )}
          className="space-y-4"
        >
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Lanyard Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Manufacturer"
                error={errors.formData?.manufacturer?.message}
                required
              >
                <input
                  {...register("formData.manufacturer")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Date of Manufacture"
                error={errors.formData?.dateOfManufacture?.message}
                required
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
                required
              >
                <input
                  {...register("formData.serialNumber")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Model #"
                error={errors.formData?.modelNumber?.message}
                required
              >
                <input
                  {...register("formData.modelNumber")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Type of Lanyard & Material"
                error={errors.formData?.typeMaterial?.message}
                required
              >
                <input
                  {...register("formData.typeMaterial")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>
          </div>

          {/* Inspection Information */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Inspection Information
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
                error={errors.formData?.authorizedPerson?.message}
                required
              >
                <input
                  {...register("formData.authorizedPerson")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

              <FormField
                label="Name of Competent Person"
                error={errors.formData?.competentPerson?.message}
                required
              >
                <input
                  {...register("formData.competentPerson")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>
            </div>
          </div>

          {/* Labels & Markings Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              LABELS & MARKINGS
            </h2>

            <div className="grid grid-cols-12 gap-2 items-center mb-2 bg-blue-50 py-2">
              <div className="col-span-4 font-semibold">Item</div>
              <div className="col-span-2 text-center font-semibold text-green-600">
                PASS
              </div>
              <div className="col-span-2 text-center font-semibold text-red-600">
                FAIL
              </div>
              <div className="col-span-4 font-semibold">NOTE</div>
            </div>

            <CheckboxField
              label="Label (legible/in tact)"
              passName="formData.labelsAndMarkings.label.pass"
              failName="formData.labelsAndMarkings.label.fail"
              noteName="formData.labelsAndMarkings.label.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Appropriate (ANSI/OSHA) Markings"
              passName="formData.labelsAndMarkings.markings.pass"
              failName="formData.labelsAndMarkings.markings.fail"
              noteName="formData.labelsAndMarkings.markings.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Date of First Use"
              passName="formData.labelsAndMarkings.dateOfFirstUse.pass"
              failName="formData.labelsAndMarkings.dateOfFirstUse.fail"
              noteName="formData.labelsAndMarkings.dateOfFirstUse.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Inspections Current / Up to Date"
              passName="formData.labelsAndMarkings.inspectionsCurrent.pass"
              failName="formData.labelsAndMarkings.inspectionsCurrent.fail"
              noteName="formData.labelsAndMarkings.inspectionsCurrent.note"
              register={register}
              errors={errors}
            />
          </div>

          {/* Connectors Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              CONNECTORS
            </h2>

            <div className="grid grid-cols-12 gap-2 items-center mb-2 bg-blue-50 py-2">
              <div className="col-span-4 font-semibold">Item</div>
              <div className="col-span-2 text-center font-semibold text-green-600">
                PASS
              </div>
              <div className="col-span-2 text-center font-semibold text-red-600">
                FAIL
              </div>
              <div className="col-span-4 font-semibold">NOTE</div>
            </div>

            <CheckboxField
              label="Connector (self closing& locking)"
              passName="formData.connectors.connector.pass"
              failName="formData.connectors.connector.fail"
              noteName="formData.connectors.connector.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Hook Gate / Rivets"
              passName="formData.connectors.hookGateRivets.pass"
              failName="formData.connectors.hookGateRivets.fail"
              noteName="formData.connectors.hookGateRivets.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Corrosion"
              passName="formData.connectors.corrosion.pass"
              failName="formData.connectors.corrosion.fail"
              noteName="formData.connectors.corrosion.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Pitting / Nicks"
              passName="formData.connectors.pittingNicks.pass"
              failName="formData.connectors.pittingNicks.fail"
              noteName="formData.connectors.pittingNicks.note"
              register={register}
              errors={errors}
            />
          </div>

          {/* Material Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              MATERIAL (WEB or CABLE)
            </h2>

            <div className="grid grid-cols-12 gap-2 items-center mb-2 bg-blue-50 py-2">
              <div className="col-span-4 font-semibold">Item</div>
              <div className="col-span-2 text-center font-semibold text-green-600">
                PASS
              </div>
              <div className="col-span-2 text-center font-semibold text-red-600">
                FAIL
              </div>
              <div className="col-span-4 font-semibold">NOTE</div>
            </div>

            <CheckboxField
              label="Broken / Missing / Loose Stitching"
              passName="formData.material.brokenStitching.pass"
              failName="formData.material.brokenStitching.fail"
              noteName="formData.material.brokenStitching.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Termination (Stitch, Splice or Swag)"
              passName="formData.material.termination.pass"
              failName="formData.material.termination.fail"
              noteName="formData.material.termination.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Webbing Length"
              passName="formData.material.webbingLength.pass"
              failName="formData.material.webbingLength.fail"
              noteName="formData.material.webbingLength.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Cuts / Burns / Holes / Paint Damage"
              passName="formData.material.cutsBurns.pass"
              failName="formData.material.cutsBurns.fail"
              noteName="formData.material.cutsBurns.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Cable Separating / Bird-Caging"
              passName="formData.material.cableSeparating.pass"
              failName="formData.material.cableSeparating.fail"
              noteName="formData.material.cableSeparating.note"
              register={register}
              errors={errors}
            />
          </div>

          {/* Shock Pack Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              SHOCK PACK (if present)
            </h2>

            <div className="grid grid-cols-12 gap-2 items-center mb-2 bg-blue-50 py-2">
              <div className="col-span-4 font-semibold">Item</div>
              <div className="col-span-2 text-center font-semibold text-green-600">
                PASS
              </div>
              <div className="col-span-2 text-center font-semibold text-red-600">
                FAIL
              </div>
              <div className="col-span-4 font-semibold">NOTE</div>
            </div>

            <CheckboxField
              label="Cover / Shrink Tube (Don't cut or remove)"
              passName="formData.shockPack.coverShrinkTube.pass"
              failName="formData.shockPack.coverShrinkTube.fail"
              noteName="formData.shockPack.coverShrinkTube.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Damage / Fraying / Broken Stitching"
              passName="formData.shockPack.damageFraying.pass"
              failName="formData.shockPack.damageFraying.fail"
              noteName="formData.shockPack.damageFraying.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Impact Indicator (Signs of Deployment)"
              passName="formData.shockPack.impactIndicator.pass"
              failName="formData.shockPack.impactIndicator.fail"
              noteName="formData.shockPack.impactIndicator.note"
              register={register}
              errors={errors}
            />
          </div>

          {/* Additional Notes Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              ADDITIONAL NOTES
            </h2>

            <FormField
              label=""
              error={errors.formData?.additionalNotes?.message}
            >
              <textarea
                {...register("formData.additionalNotes")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={5}
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
                  Generate PDF for this Lanyard Inspection
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
