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
import { generatePDF } from "../../components/pdfUtils";
import { useRouter } from "next/navigation";
import { PermissionContext } from "../../context/PermissionContext";

type PurchaseOrder = {
  id: number;
  poNumber: string;
  poDate: string;
  jobId: number;
  projectName: string;
  shortDescription: string;
  projectManager: string;
  shipTo: string;
  amount: string;
  dueDate: string;
  vendorName: string;
  notes?: string;
  received?: string;
  backorder?: string;
  attachmentCount?: number;
};

export default function PurchaseOrderListPage() {
  const router = useRouter();
  const { hasWritePermission, isLoaded } = useContext(PermissionContext);
  const [rowData, setRowData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize] = useState(50);
  const [selectedPO, setSelectedPO] = useState<number | null>(null);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  // Show a loading message until permissions are loaded
  if (!isLoaded) {
    return <div className="p-6">Loading permissions...</div>;
  }

  // Memoized handlers
  const handlePrint = useCallback((po: PurchaseOrder) => {
    generatePDF({
      poNumber: po.poNumber,
      poDate: po.poDate,
      projectName: po.projectName,
      shortDescription: po.shortDescription,
      amount: po.amount,
      projectManager: po.projectManager,
      vendorName: po.vendorName,
      dueDate: po.dueDate,
      shipTo: po.shipTo,
    });
  }, []);

  const handleOpenAttachments = useCallback((poId: number) => {
    setSelectedPO(poId);
    setIsAttachmentModalOpen(true);
  }, []);

  const handleCloseAttachments = useCallback(() => {
    setIsAttachmentModalOpen(false);
    // Optionally refresh the page when the dialog closes
    setSelectedPO(null);
  }, []);

  const handleAttachmentUpdate = useCallback(
    (recordId: number, newAttachmentCount: number) => {
      setRowData((prevData) =>
        prevData.map((po) =>
          po.id === recordId
            ? { ...po, attachmentCount: newAttachmentCount }
            : po
        )
      );
    },
    []
  );

  // Memoized column definitions with permission checks for Edit and Delete
  const columnDefs = useMemo<ColDef<PurchaseOrder>[]>(
    () => [
      {
        headerName: "PO Number",
        field: "poNumber",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 50,
      },
      {
        headerName: "PO Date",
        field: "poDate",
        filter: "agDateColumnFilter",
        valueFormatter: ({ value }) =>
          value ? format(new Date(value), "MM/dd/yyyy") : "",
        comparator: (dateA, dateB) =>
          new Date(dateA).getTime() - new Date(dateB).getTime(),
      },
      {
        headerName: "Vendor",
        field: "vendorName",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 150,
      },

      {
        headerName: "Description",
        field: "shortDescription",
        filter: "agTextColumnFilter",
        flex: 2,
        minWidth: 200,
      },
      {
        headerName: "Project",
        field: "projectName",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: "Due Date",
        field: "dueDate",
        filter: "agDateColumnFilter",
        valueFormatter: ({ value }) =>
          value ? format(new Date(value), "MM/dd/yyyy") : "",
        comparator: (dateA, dateB) =>
          new Date(dateA).getTime() - new Date(dateB).getTime(),
      },

      {
        headerName: "Ship To",
        field: "shipTo",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: "Project Manager",
        field: "projectManager",
        filter: "agTextColumnFilter",
        flex: 1,
        minWidth: 150,
      },

      {
        headerName: "Amount",
        field: "amount",
        type: "numericColumn",
        valueFormatter: ({ value }) => `$${Number(value).toFixed(2)}`,
        filter: "agNumberColumnFilter",
        flex: 1,
        minWidth: 150,
      },
      {
        headerName: "Actions",
        field: "id",
        flex: 1,
        minWidth: 200,
        cellRenderer: (params: ICellRendererParams<PurchaseOrder>) => (
          <div className="flex items-center gap-2 py-1">
            <button
              onClick={() => router.push(`/modules/purchasing/${params.value}`)}
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
              onClick={() => handleOpenAttachments(params.value!)}
              className={`relative p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors ${
                !hasWritePermission
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-red-200"
              }`}
              disabled={!hasWritePermission}
              title={
                hasWritePermission
                  ? "Edit Attachments"
                  : "You do not have permission to edit or add attachments"
              }
            >
              <PaperClipIcon className="w-5 h-5" />
              {params.data?.attachmentCount &&
              params.data?.attachmentCount > 0 ? (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full">
                  {params.data.attachmentCount}
                </span>
              ) : null}
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
    [router, handleOpenAttachments, handlePrint, hasWritePermission]
  );

  // Delete handler
  const handleDelete = useCallback(async (poId: number) => {
    if (
      window.confirm("Are you sure you want to delete this purchase order?")
    ) {
      try {
        const response = await fetch(`/api/purchasing/${poId}`, {
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
  const loadPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/purchasing");
      if (!response.ok) throw new Error("Error fetching purchase orders");
      const data = await response.json();
      setRowData(data.purchaseOrders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loading failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  // Row style for backorder and received highlighting
  // Backorder (pink) takes precedence over received (yellow)
  const getRowStyle = useCallback((params: any) => {
    const data = params.data;

    // Priority: backorder (pink) takes precedence over received (yellow)
    if (data?.backorder && data.backorder.trim() !== "") {
      return { backgroundColor: "#fce7f3" }; // light pink
    }

    if (data?.received && data.received.trim() !== "") {
      return { backgroundColor: "#fef3c7" }; // light yellow
    }

    return undefined;
  }, []);

  if (loading) return <div className="p-6">Loading purchase orders...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="w-full p-6 bg-white rounded-md shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">
          Purchase Orders
        </h1>
        <button
          onClick={() => router.push("/modules/purchasing/new")}
          className={`bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition-colors ${
            !hasWritePermission
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-indigo-700"
          }`}
          disabled={!hasWritePermission}
          title={
            hasWritePermission
              ? "Add Purchase Order"
              : "You do not have permission to add purchase orders"
          }
        >
          Add Purchase Order
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
          getRowStyle={getRowStyle}
        />
      </div>

      <AttachmentModal
        isOpen={isAttachmentModalOpen}
        onClose={handleCloseAttachments}
        recordId={selectedPO ?? 0}
        tableName="purchase_orders"
        onAttachmentUpdate={handleAttachmentUpdate}
      />
    </div>
  );
}
