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

// Define the checklist item type
const checklistItemSchema = z.object({
  id: z.number(),
  description: z.string(),
  status: z.enum(["S", "I", "NA"]).optional(),
});

type ChecklistItem = z.infer<typeof checklistItemSchema>;

const scaffoldInspectionSchema = z.object({
  formName: z.string().default("Scaffold-Inspection"),
  pdfName: z.string().default("ScaffoldInspection.pdf"),
  userName: z.string().min(1, "User name is required"),
  jobName: z.string().min(1, "Job name is required"),
  dateCreated: z.string().min(1, "Date is required"),
  formData: z.object({
    jobNumber: z.string().optional(),

    // Project Information
    projectName: z.string().min(1, "Project name is required"),
    inspectionDate: z.string().min(1, "Inspection date is required"),
    address: z.string().optional(),
    superintendentName: z.string().min(1, "Superintendent name is required"),
    weather: z.string().optional(),

    // Checklist Items (25 items total)
    checklistItems: z.array(checklistItemSchema),

    // Notes
    notes: z.string().optional(),

    generatePDF: z.boolean().default(false),
  }),
});

type ScaffoldInspectionForm = z.infer<typeof scaffoldInspectionSchema>;

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

// Checklist items data (with descriptions)
const checklistItemsData: Omit<ChecklistItem, "status">[] = [
  {
    id: 1,
    description: "Scaffold erected under supervision of a qualified person",
  },
  { id: 2, description: "Permit obtained for scaffold over 36 feet" },
  {
    id: 3,
    description:
      "The scaffold erectors properly trained and informed of safe work practices while working on scaffold",
  },
  {
    id: 4,
    description:
      "Scaffold components and planking inspected, good condition & safe to use",
  },
  {
    id: 5,
    description:
      "Environmental, hazardous conditions have been prepared for (e.g. wind, rain, ice, )",
  },
  {
    id: 6,
    description: "Scaffold legs braced with braces properly attached/secured",
  },
  { id: 7, description: "Scaffold is level and plumb" },
  {
    id: 8,
    description:
      "Only Scaffold grade planking used and working levels of scaffold fully planked",
  },
  {
    id: 9,
    description:
      "Planking have a minimum of 12'' overlap extended beyond supports and cleated ends",
  },
  {
    id: 10,
    description:
      "Guard railing in place on open sides and Ends (mid rail/cross bar, top rail, end rail)",
  },
  { id: 11, description: "Proper access provided to all levels of scaffold" },
  {
    id: 12,
    description:
      "Mud sills properly placed, sized and secured when on earth or soft material",
  },
  {
    id: 13,
    description:
      "Base plates and screw jacks firm contact with sills and frames",
  },
  { id: 14, description: "Toe boards properly installed when required" },
  {
    id: 15,
    description:
      "Ladders access used in good condition, properly braced and anchored",
  },
  {
    id: 16,
    description:
      "If ties are used, scaffold is tied off using 10 gauge (single loop) or 12 gauge (double Looped) wire",
  },
  { id: 17, description: "Rolling Tower/Baker/Perry Scaffold" }, // This is a heading, not an item to check
  {
    id: 18,
    description:
      "Outriggers (if required) properly installed on both sides of rolling scaffold",
  },
  {
    id: 19,
    description: "Platforms fully planked with no gaps greater than 1 inch.",
  },
  {
    id: 20,
    description:
      "Wheel brakes operable and employees instructed to set brakes while in use",
  },
  {
    id: 21,
    description:
      "Safety rails properly installed at required fall protection level",
  },
  { id: 22, description: "Casters or wheel stems properly pinned/secured" },
  {
    id: 23,
    description: "Side rail braces properly locked in place with end frames",
  },
  {
    id: 24,
    description:
      "Employees properly trained on safe work practices for Rolling/Baker/Perry scaffold",
  },
  {
    id: 25,
    description:
      "Scaffold properly tagged, signed and approved for use. (All Scaffold Types)",
  },
];

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

export default function ScaffoldInspectionPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const { user } = useUser();
  const fullName = useFullNameFromDB();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "success">(
    "loading"
  );

  const methods = useForm<ScaffoldInspectionForm>({
    resolver: zodResolver(scaffoldInspectionSchema),
    defaultValues: {
      formName: "Scaffold-Inspection",
      pdfName: "ScaffoldInspection.pdf",
      dateCreated: new Date().toISOString().split("T")[0],
      userName: fullName || "",
      jobName: "",
      formData: {
        jobNumber: "",
        projectName: "",
        inspectionDate: new Date().toISOString().split("T")[0],
        address: "",
        superintendentName: "",
        weather: "",
        checklistItems: checklistItemsData.map((item) => ({
          ...item,
          status: undefined,
        })),
        notes: "",
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
    async (data: ScaffoldInspectionForm) => {
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

  const loadScaffoldInspection = useCallback(
    async (formId: string) => {
      try {
        const response = await fetch(`/api/safety/${formId}`);
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const result = await response.json();
        console.log("Scaffold Inspection API response:", result);

        if (!result.submission) {
          throw new Error(result.error || "Invalid response structure");
        }

        const form = result.submission;

        // Make sure we have all checklist items, with correct defaults
        let checklistItems = form.formData.checklistItems || [];
        if (!checklistItems.length) {
          checklistItems = checklistItemsData.map((item) => ({
            ...item,
            status: undefined,
          }));
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
            checklistItems,
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

        // Now load the scaffold inspection if we're editing
        if (id && id !== "new") {
          await loadScaffoldInspection(id);
        } else {
          setStatus("success");
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchData();
  }, [id, loadScaffoldInspection, loadJobs]);

  // ---------------- Form Submission ----------------

  const onSubmit = async (formData: ScaffoldInspectionForm) => {
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
          ? "Edit Scaffold Inspection"
          : "New Scaffold Inspection"}
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

          {/* Project Information Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Project Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                label="Project Name"
                error={errors.formData?.projectName?.message}
                required
              >
                <input
                  {...register("formData.projectName")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                />
              </FormField>

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
                label="Address"
                error={errors.formData?.address?.message}
              >
                <input
                  {...register("formData.address")}
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
          </div>

          {/* Inspection Checklist Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">
              Inspection Checklist
            </h2>

            <div className="mb-4 bg-blue-50 p-3 rounded text-sm">
              <div className="font-medium mb-1">Guidelines:</div>
              <div className="flex space-x-4">
                <div>
                  <strong>S</strong> – Satisfactory
                </div>
                <div>
                  <strong>I</strong> – Improvement Needed
                </div>
                <div>
                  <strong>N/A</strong> – Not applicable
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse mb-4">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 border text-left w-8">#</th>
                    <th className="px-3 py-2 border text-left">
                      Inspection Item
                    </th>
                    <th className="px-3 py-2 border text-center w-16">S</th>
                    <th className="px-3 py-2 border text-center w-16">I</th>
                    <th className="px-3 py-2 border text-center w-16">N/A</th>
                  </tr>
                </thead>
                <tbody>
                  {checklistItemsData.map((item, index) => (
                    <tr
                      key={item.id}
                      className={
                        item.id === 17 ? "bg-gray-200 font-medium" : ""
                      }
                    >
                      <td className="px-3 py-2 border text-center">
                        {item.id}
                      </td>
                      <td className="px-3 py-2 border">{item.description}</td>
                      {item.id !== 17 ? (
                        <>
                          <td className="px-3 py-2 border text-center">
                            <input
                              type="radio"
                              id={`s-${item.id}`}
                              value="S"
                              {...register(
                                `formData.checklistItems.${index}.status`
                              )}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-3 py-2 border text-center">
                            <input
                              type="radio"
                              id={`i-${item.id}`}
                              value="I"
                              {...register(
                                `formData.checklistItems.${index}.status`
                              )}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-3 py-2 border text-center">
                            <input
                              type="radio"
                              id={`na-${item.id}`}
                              value="NA"
                              {...register(
                                `formData.checklistItems.${index}.status`
                              )}
                              className="w-4 h-4"
                            />
                          </td>
                        </>
                      ) : (
                        <td colSpan={3} className="px-3 py-2 border"></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h2 className="text-xl font-medium text-gray-700 mb-4">Notes</h2>

            <FormField label="" error={errors.formData?.notes?.message}>
              <textarea
                {...register("formData.notes")}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-indigo-100"
                rows={4}
                placeholder="Add any additional notes here"
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
                  Generate PDF for this Scaffold Inspection
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
