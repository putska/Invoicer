//modules/purchasing/page.tsx

"use client";

import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  useRef,
} from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, ICellRendererParams, GridApi } from "ag-grid-community";
import AttachmentModal from "../../components/AttachmentModal";
import {
  PaperClipIcon,
  PrinterIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { generatePDF } from "../../components/pdfUtils";
import { useRouter, useSearchParams } from "next/navigation";
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
  const searchParams = useSearchParams();
  const { hasWritePermission, isLoaded } = useContext(PermissionContext);
  const [rowData, setRowData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize] = useState(50);
  const [selectedPO, setSelectedPO] = useState<number | null>(null);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);

  // Grid API reference
  const gridApiRef = useRef<GridApi | null>(null);

  // Show a loading message until permissions are loaded
  if (!isLoaded) {
    return <div className="p-6">Loading permissions...</div>;
  }

  // Store grid state in sessionStorage
  const saveGridState = useCallback(() => {
    if (gridApiRef.current) {
      const gridState = {
        page: gridApiRef.current.paginationGetCurrentPage(),
        filterModel: gridApiRef.current.getFilterModel(),
        sortModel: gridApiRef.current
          .getColumnState()
          .filter((col) => col.sort !== null),
      };
      sessionStorage.setItem("po-grid-state", JSON.stringify(gridState));
    }
  }, []);

  // Restore grid state from sessionStorage or URL params
  const restoreGridState = useCallback(() => {
    if (!gridApiRef.current) return;

    // Check URL parameters first (for return from edit)
    const urlPage = searchParams.get("page");
    const urlFilters = searchParams.get("filters");
    const urlSort = searchParams.get("sort");

    if (urlPage || urlFilters || urlSort) {
      // Restore from URL parameters
      if (urlPage) {
        gridApiRef.current.paginationGoToPage(parseInt(urlPage));
      }
      if (urlFilters) {
        try {
          const filterModel = JSON.parse(decodeURIComponent(urlFilters));
          gridApiRef.current.setFilterModel(filterModel);
        } catch (e) {
          console.warn("Failed to parse filters from URL:", e);
        }
      }
      if (urlSort) {
        try {
          const sortModel = JSON.parse(decodeURIComponent(urlSort));
          // Apply sort using column state
          const currentColumnState = gridApiRef.current.getColumnState();
          const updatedColumnState = currentColumnState.map((col) => {
            const sortInfo = sortModel.find((s: any) => s.colId === col.colId);
            return sortInfo
              ? { ...col, sort: sortInfo.sort, sortIndex: sortInfo.sortIndex }
              : { ...col, sort: null };
          });
          gridApiRef.current.applyColumnState({ state: updatedColumnState });
        } catch (e) {
          console.warn("Failed to parse sort from URL:", e);
        }
      }

      // Clean up URL parameters after restoring state
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    } else {
      // Restore from sessionStorage
      const savedState = sessionStorage.getItem("po-grid-state");
      if (savedState) {
        try {
          const gridState = JSON.parse(savedState);

          if (gridState.page !== undefined) {
            gridApiRef.current.paginationGoToPage(gridState.page);
          }
          if (gridState.filterModel) {
            gridApiRef.current.setFilterModel(gridState.filterModel);
          }
          if (gridState.sortModel) {
            // Apply sort using column state
            const currentColumnState = gridApiRef.current.getColumnState();
            const updatedColumnState = currentColumnState.map((col) => {
              const sortInfo = gridState.sortModel.find(
                (s: any) => s.colId === col.colId
              );
              return sortInfo
                ? { ...col, sort: sortInfo.sort, sortIndex: sortInfo.sortIndex }
                : { ...col, sort: null };
            });
            gridApiRef.current.applyColumnState({ state: updatedColumnState });
          }
        } catch (e) {
          console.warn("Failed to restore grid state:", e);
        }
      }
    }
  }, [searchParams]);

  // Enhanced edit handler that captures grid state
  const handleEdit = useCallback(
    (poId: number) => {
      // Save current grid state
      saveGridState();

      // Get current grid state for URL parameters
      if (gridApiRef.current) {
        const currentPage = gridApiRef.current.paginationGetCurrentPage();
        const filterModel = gridApiRef.current.getFilterModel();
        const sortModel = gridApiRef.current
          .getColumnState()
          .filter((col) => col.sort !== null);

        // Build the edit URL with grid state parameters
        const editUrl = new URL(
          `/modules/purchasing/${poId}`,
          window.location.origin
        );
        editUrl.searchParams.set("returnUrl", window.location.pathname);
        editUrl.searchParams.set("gridPage", currentPage.toString());

        if (Object.keys(filterModel).length > 0) {
          editUrl.searchParams.set(
            "gridFilters",
            encodeURIComponent(JSON.stringify(filterModel))
          );
        }

        if (sortModel.length > 0) {
          editUrl.searchParams.set(
            "gridSort",
            encodeURIComponent(JSON.stringify(sortModel))
          );
        }

        router.push(editUrl.toString());
      } else {
        // Fallback if grid API not available
        router.push(`/modules/purchasing/${poId}`);
      }
    },
    [router, saveGridState]
  );

  // Grid event handlers
  const onGridReady = useCallback(
    (params: any) => {
      gridApiRef.current = params.api;

      // Restore state after grid is ready and data is loaded
      setTimeout(() => {
        restoreGridState();
      }, 100);
    },
    [restoreGridState]
  );

  const onPaginationChanged = useCallback(() => {
    saveGridState();
  }, [saveGridState]);

  const onFilterChanged = useCallback(() => {
    saveGridState();
  }, [saveGridState]);

  const onSortChanged = useCallback(() => {
    saveGridState();
  }, [saveGridState]);

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

  // Updated column definitions with new edit handler
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
              onClick={() => handleEdit(params.value!)}
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
    [handleEdit, handleOpenAttachments, handlePrint, hasWritePermission]
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
          onGridReady={onGridReady}
          onPaginationChanged={onPaginationChanged}
          onFilterChanged={onFilterChanged}
          onSortChanged={onSortChanged}
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
