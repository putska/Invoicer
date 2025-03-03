"use client";

import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import AttachmentModal from "../../components/AttachmentModal";
import {
  PaperClipIcon,
  PrinterIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { generatePDF } from "../../components/PdfUtilsSafety";
import { useRouter } from "next/navigation";
import { PermissionContext } from "../../context/PermissionContext";
import FormTypeSelector from "../../components/FormTypeSelector";

type FormSubmission = {
  id: number;
  formName: string;
  pdfName: string;
  jobName: string;
  userName: string;
  dateCreated: string;
  submissionDate: Date;
  formData: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
};

export default function SafetyFormListPage() {
  const router = useRouter();
  const { hasWritePermission, isLoaded } = useContext(PermissionContext);
  const [rowData, setRowData] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize] = useState(50);
  const [selectedForm, setSelectedForm] = useState<number | null>(null);
  const [isFormSelectorOpen, setFormSelectorOpen] = useState(false);

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
                  ? "Edit Purchase Order"
                  : "You do not have permission to edit purchase orders"
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
                  ? "Delete Purchase Order"
                  : "You do not have permission to delete purchase orders"
              }
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>

            <button
              onClick={() => handlePrint(params.data!)}
              className={`relative p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors ${
                !hasWritePermission
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-red-200"
              }`}
              disabled={!hasWritePermission}
              title={
                hasWritePermission
                  ? "Print PO"
                  : "You do not have permission to print PO's"
              }
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
      case "mewp":
        router.push(`/modules/safety/mewp/${form.id}`);
        break;
      case "telehandler":
        router.push(`/modules/safety/telehandler/${form.id}`);
        break;
      default:
        console.error("Unknown form type");
    }
  };

  // Delete handler
  const handleDelete = useCallback(async (poId: number) => {
    if (
      window.confirm("Are you sure you want to delete this purchase order?")
    ) {
      try {
        const response = await fetch(`/api/safety/${poId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Error deleting purchase order");
        setRowData((prev) => prev.filter((po) => po.id !== poId));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Deletion failed");
      }
    }
  }, []);

  // Data loading
  const loadSafetyForms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/safety");
      if (!response.ok) throw new Error("Error fetching safety forms");
      const data = await response.json();
      console.log("Data fetched for safety forms:", data);
      setRowData(data.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loading failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSafetyForms();
  }, [loadSafetyForms]);

  if (loading) return <div className="p-6">Loading safety forms...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="w-full p-6 bg-white rounded-md shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">Safety Forms</h1>
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

      <div
        className="ag-theme-alpine"
        style={{ height: "calc(100vh - 250px)", width: "100%" }}
      >
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={pageSize}
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
