"use client";

import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import {
  PencilSquareIcon,
  TrashIcon,
  PrinterIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { generatePDF } from "../../components/PdfUtilsSafety";
import { useRouter } from "next/navigation";
import { PermissionContext } from "../../context/PermissionContext";
import FormTypeSelector from "../../components/FormTypeSelector";
import {
  searchForms,
  deleteSafetyForm,
  loadAllForms,
} from "./safetyClientActions";
import { FormSubmission } from "../../types";

export default function SafetyFormListPage({
  initialForms = [],
}: {
  initialForms?: FormSubmission[];
}) {
  const router = useRouter();
  const { hasWritePermission, isLoaded } = useContext(PermissionContext);
  // Initialize with initialForms if provided, otherwise empty array
  const [rowData, setRowData] = useState<FormSubmission[]>(initialForms);
  const [loading, setLoading] = useState(initialForms.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [pageSize] = useState(50);
  const [isFormSelectorOpen, setFormSelectorOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Show a loading message until permissions are loaded
  if (!isLoaded) {
    return <div className="p-6">Loading permissions...</div>;
  }

  // Memoized handlers
  const handlePrint = useCallback((form: FormSubmission) => {
    console.log("Printing form:", form.formName, form.id);
    generatePDF({
      id: form.id,
      formName: form.formName,
      pdfName: form.pdfName,
      jobName: form.jobName,
      userName: form.userName,
      dateCreated: form.dateCreated,
      submissionDate: form.submissionDate,
      formData: form.formData,
    });
  }, []);

  // Memoized column definitions with permission checks for Edit and Delete
  const columnDefs = useMemo<ColDef<FormSubmission>[]>(
    () => [
      {
        headerName: "Form ID",
        field: "id",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 20,
      },
      {
        headerName: "Form Name",
        field: "formName",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 100,
      },
      {
        headerName: "Date Created",
        field: "dateCreated",
        filter: "agDateColumnFilter",
        valueFormatter: ({ value }) =>
          value ? format(new Date(value), "MM/dd/yyyy") : "",
        comparator: (dateA, dateB) =>
          new Date(dateA).getTime() - new Date(dateB).getTime(),
      },
      {
        headerName: "PDF Name",
        field: "pdfName",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: "User Name",
        field: "userName",
        filter: "agTextColumnFilter",
        flex: 2,
        minWidth: 200,
      },
      {
        headerName: "Form Data",
        field: "formData",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 150,
        valueFormatter: ({ value }) => {
          // Show a simplified preview of the JSON data
          if (!value) return "";
          return Object.keys(value).length + " fields";
        },
        cellRenderer: (params: ICellRendererParams<FormSubmission>) => {
          if (!params.value) return "";
          // Create a simplified preview of key form data fields
          const formData = params.value;
          const keys = Object.keys(formData).slice(0, 3); // Show first 3 keys
          return (
            <div
              className="overflow-hidden text-ellipsis"
              title={JSON.stringify(formData)}
            >
              {keys.map((key) => (
                <div key={key} className="truncate">
                  {key}: {String(formData[key]).substring(0, 20)}
                </div>
              ))}
              {Object.keys(formData).length > 3 && <div>...</div>}
            </div>
          );
        },
      },
      {
        headerName: "Actions",
        field: "id",
        flex: 1,
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<FormSubmission>) => (
          <div className="flex items-center gap-2 py-1">
            <button
              onClick={() => params.data && handleEdit(params.data)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-md transition-colors ${
                !hasWritePermission
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-indigo-200"
              }`}
              disabled={!hasWritePermission}
              title={
                hasWritePermission
                  ? "Edit Form"
                  : "You do not have permission to edit forms"
              }
            >
              <PencilSquareIcon className="w-4 h-4" />
              Edit
            </button>

            <button
              onClick={() => handleDelete(params.value!)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md transition-colors ${
                !hasWritePermission
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-red-200"
              }`}
              disabled={!hasWritePermission}
              title={
                hasWritePermission
                  ? "Delete Form"
                  : "You do not have permission to delete forms"
              }
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>

            <button
              onClick={() => handlePrint(params.data!)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              title="Print Form"
            >
              <PrinterIcon className="w-5 h-5" />
            </button>
          </div>
        ),
      },
    ],
    [router, handlePrint, hasWritePermission]
  );

  // Edit handler
  const handleEdit = (form: FormSubmission) => {
    console.log("Editing form:", form.formName, form.id);
    switch (form.formName.toLowerCase()) {
      case "fall-protection":
        router.push(`/modules/safety/fall-protection/${form.id}`);
        break;
      case "jha":
        router.push(`/modules/safety/jha/${form.id}`);
        break;
      case "tha":
        router.push(`/modules/safety/tha/${form.id}`);
        break;
      case "mewp":
        router.push(`/modules/safety/mewp/${form.id}`);
        break;
      case "witness-statement":
        router.push(`/modules/safety/witness-statement/${form.id}`);
        break;
      case "near-miss-report":
        router.push(`/modules/safety/near-miss/${form.id}`);
        break;
      case "safety-violation":
        router.push(`/modules/safety/safety-violation/${form.id}`);
        break;
      case "scaffold-inspection":
        router.push(`/modules/safety/scaffold-inspection/${form.id}`);
        break;
      case "safety-meeting":
        router.push(`/modules/safety/safety-meeting/${form.id}`);
        break;
      case "swing-stage":
        router.push(`/modules/safety/swing-stage/${form.id}`);
        break;
      case "telehandler":
        router.push(`/modules/safety/telehandler/${form.id}`);
        break;
      case "lanyard-inspection":
        router.push(`/modules/safety/lanyard-inspection/${form.id}`);
        break;
      case "jobsite-safety-inspection":
        router.push(`/modules/safety/jobsite-safety/${form.id}`);
        break;
      case "accident-incident-report":
        router.push(`/modules/safety/accident-incident-report/${form.id}`);
        break;
      default:
        console.error("Unknown form type");
    }
  };

  // Delete handler
  const handleDelete = useCallback(async (formId: number) => {
    if (window.confirm("Are you sure you want to delete this form?")) {
      try {
        const success = await deleteSafetyForm(formId);
        if (success) {
          // Update the UI by removing the deleted form
          setRowData((prev) => prev.filter((form) => form.id !== formId));
        } else {
          throw new Error("Failed to delete form");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Deletion failed");
      }
    }
  }, []);

  // Data loading
  const loadSafetyForms = useCallback(async () => {
    try {
      setLoading(true);
      const forms = await loadAllForms();
      setRowData(
        forms.map((form) => ({
          ...form,
          dateCreated: form.dateCreated || "",
          formData: form.formData as Record<string, any>,
        }))
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loading failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data loading - only if we don't have initialForms
  useEffect(() => {
    if (initialForms.length === 0) {
      loadSafetyForms();
    }

    // Cleanup timeout on component unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [loadSafetyForms, searchTimeout, initialForms]);

  // Search handler with debounce
  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);

      // Clear previous timeout to implement debounce
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      // Set a new timeout to implement debounce
      const newTimeout = setTimeout(async () => {
        try {
          setLoading(true);
          if (!query.trim()) {
            // If search is cleared, load all forms
            await loadSafetyForms();
          } else {
            // Otherwise search with the query
            const results = await searchForms(query);
            setRowData(
              (results.submissions || []).map((form: FormSubmission) => ({
                ...form,
                dateCreated: form.dateCreated || "",
                formData: form.formData as Record<string, any>,
              }))
            );
            setError(null);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Search failed");
        } finally {
          setLoading(false);
        }
      }, 500); // 500ms debounce time

      setSearchTimeout(newTimeout);
    },
    [searchTimeout, loadSafetyForms]
  );

  // Clear search
  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    loadSafetyForms();
  }, [loadSafetyForms]);

  // Initial data loading
  useEffect(() => {
    loadSafetyForms();
    // Cleanup timeout on component unmount
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [loadSafetyForms, searchTimeout]);

  if (loading && !rowData.length) {
    return <div className="p-6">Loading safety forms...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={loadSafetyForms}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full p-6 bg-white rounded-md shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">Safety Forms</h1>
        <div className="flex gap-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search forms..."
              className="w-64 px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setFormSelectorOpen(true)}
            className={`bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition-colors ${
              !hasWritePermission
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-indigo-700"
            }`}
            disabled={!hasWritePermission}
            title={
              hasWritePermission
                ? "Add New Safety Form"
                : "You do not have permission to add safety forms"
            }
          >
            Add New Safety Form
          </button>
        </div>
      </div>

      {loading && rowData.length > 0 && (
        <div className="mb-4 text-gray-500">Updating results...</div>
      )}

      <div
        className="ag-theme-alpine"
        style={{ height: "calc(100vh - 250px)", width: "100%" }}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={pageSize}
          defaultColDef={{
            sortable: true,
            resizable: true,
          }}
          overlayNoRowsTemplate={
            searchQuery
              ? "No forms match your search criteria"
              : "No forms found"
          }
        />
      </div>

      {/* Modal for selecting a new form type */}
      {isFormSelectorOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <FormTypeSelector onClose={() => setFormSelectorOpen(false)} />
        </div>
      )}
    </div>
  );
}
