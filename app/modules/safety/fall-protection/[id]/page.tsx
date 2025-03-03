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

const fallProtectionSchema = z.object({
  formName: z.string().default("Fall Protection Inspection Form"),
  pdfName: z.string().default("FallProtection.pdf"),
  userName: z.string().min(1, "User name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  formData: z.object({
    manufacturer: z.string().min(1, "Manufacturer is required"),
    dateOfManufacture: z.string().min(1, "Date of manufacture is required"),
    serialNumber: z.string().min(1, "Serial number is required"),
    modelNumber: z.string().min(1, "Model number is required"),
    inspectionDate: z.string().min(1, "Inspection date is required"),
    removeFromServiceDate: z.string().optional(),
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
      impactIndicator: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
    }),

    // Hardware
    hardware: z.object({
      shoulderBuckles: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      legWaistBuckles: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      dRings: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      corrosion: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
    }),

    // Webbing
    webbing: z.object({
      shoulderStrap: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      cutsBurns: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      paintContamination: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      excessiveWear: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      heatDamage: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
    }),

    // Stitching
    stitching: z.object({
      shouldersChest: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
      legsBackStraps: z.object({
        pass: z.boolean().default(false),
        fail: z.boolean().default(false),
        note: z.string().optional(),
      }),
    }),

    additionalNotes: z.string().optional(),
    generatePDF: z.boolean().default(false),
  }),
});

type FallProtectionForm = z.infer<typeof fallProtectionSchema>;

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

export default function FallProtectionFormPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<FallProtectionForm>({
    resolver: zodResolver(fallProtectionSchema),
    defaultValues: {
      formName: "Fall-Protection",
      pdfName: "FallProtection.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "Stephen Watts",
      formData: {
        manufacturer: "",
        dateOfManufacture: "",
        serialNumber: "",
        modelNumber: "",
        inspectionDate: new Date().toISOString().split("T")[0],
        removeFromServiceDate: "",
        authorizedPerson: "",
        competentPerson: "",
        labelsAndMarkings: {
          label: { pass: false, fail: false, note: "" },
          markings: { pass: false, fail: false, note: "" },
          dateOfFirstUse: { pass: false, fail: false, note: "" },
          impactIndicator: { pass: false, fail: false, note: "" },
        },
        hardware: {
          shoulderBuckles: { pass: false, fail: false, note: "" },
          legWaistBuckles: { pass: false, fail: false, note: "" },
          dRings: { pass: false, fail: false, note: "" },
          corrosion: { pass: false, fail: false, note: "" },
        },
        webbing: {
          shoulderStrap: { pass: false, fail: false, note: "" },
          cutsBurns: { pass: false, fail: false, note: "" },
          paintContamination: { pass: false, fail: false, note: "" },
          excessiveWear: { pass: false, fail: false, note: "" },
          heatDamage: { pass: false, fail: false, note: "" },
        },
        stitching: {
          shouldersChest: { pass: false, fail: false, note: "" },
          legsBackStraps: { pass: false, fail: false, note: "" },
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
    async (data: FallProtectionForm) => {
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

  const onSubmit = async (formData: FallProtectionForm) => {
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
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Harness Information
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
                label="Remove from Service Date"
                error={errors.formData?.removeFromServiceDate?.message}
              >
                <input
                  type="date"
                  {...register("formData.removeFromServiceDate")}
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
              label="Impact Indicator (signs of deployment)"
              passName="formData.labelsAndMarkings.impactIndicator.pass"
              failName="formData.labelsAndMarkings.impactIndicator.fail"
              noteName="formData.labelsAndMarkings.impactIndicator.note"
              register={register}
              errors={errors}
            />
          </div>

          {/* Hardware Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              HARDWARE (BUCKLES & RINGS)
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
              label="Shoulder Adjustment Buckles"
              passName="formData.hardware.shoulderBuckles.pass"
              failName="formData.hardware.shoulderBuckles.fail"
              noteName="formData.hardware.shoulderBuckles.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Leg & Waist Buckles / Other Hardware"
              passName="formData.hardware.legWaistBuckles.pass"
              failName="formData.hardware.legWaistBuckles.fail"
              noteName="formData.hardware.legWaistBuckles.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="D-Rings (Dorsal, Side, Shoulder or Sternal)"
              passName="formData.hardware.dRings.pass"
              failName="formData.hardware.dRings.fail"
              noteName="formData.hardware.dRings.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Corrosion / Pitting / Nicks"
              passName="formData.hardware.corrosion.pass"
              failName="formData.hardware.corrosion.fail"
              noteName="formData.hardware.corrosion.note"
              register={register}
              errors={errors}
            />
          </div>

          {/* Webbing Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">WEBBING</h2>

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
              label="Shoulder / Chest / Leg / Back Strap"
              passName="formData.webbing.shoulderStrap.pass"
              failName="formData.webbing.shoulderStrap.fail"
              noteName="formData.webbing.shoulderStrap.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Cuts / Burns / Holes"
              passName="formData.webbing.cutsBurns.pass"
              failName="formData.webbing.cutsBurns.fail"
              noteName="formData.webbing.cutsBurns.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Paint Contamination"
              passName="formData.webbing.paintContamination.pass"
              failName="formData.webbing.paintContamination.fail"
              noteName="formData.webbing.paintContamination.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Excessive Wear"
              passName="formData.webbing.excessiveWear.pass"
              failName="formData.webbing.excessiveWear.fail"
              noteName="formData.webbing.excessiveWear.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Heat / UV Damage"
              passName="formData.webbing.heatDamage.pass"
              failName="formData.webbing.heatDamage.fail"
              noteName="formData.webbing.heatDamage.note"
              register={register}
              errors={errors}
            />
          </div>

          {/* Stitching Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              STITCHING
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
              label="Shoulders / Chest"
              passName="formData.stitching.shouldersChest.pass"
              failName="formData.stitching.shouldersChest.fail"
              noteName="formData.stitching.shouldersChest.note"
              register={register}
              errors={errors}
            />

            <CheckboxField
              label="Legs / Back Straps"
              passName="formData.stitching.legsBackStraps.pass"
              failName="formData.stitching.legsBackStraps.fail"
              noteName="formData.stitching.legsBackStraps.note"
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
