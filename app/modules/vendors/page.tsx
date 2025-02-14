"use client";

import { useState, useEffect, useMemo, useCallback, useContext } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { useRouter } from "next/navigation";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PermissionContext } from "../../context/PermissionContext";

type Vendor = {
  id: number;
  vendorName: string;
  vendorCity: string;
  vendorState: string;
  vendorZip: string;
  vendorPhone: string;
  vendorEmail: string;
  vendorContact: string;
  taxable: boolean;
};

export default function VendorsPage() {
  const router = useRouter();
  const { hasWritePermission, isLoaded } = useContext(PermissionContext);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize] = useState(50);

  // Show a loading message until permissions are loaded
  if (!isLoaded) {
    return <div className="p-6">Loading permissions...</div>;
  }

  // Function to load vendors from the API
  const loadVendors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/vendors");
      if (!response.ok) throw new Error("Error fetching vendors");
      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Loading failed");
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a vendor and refresh the list
  const handleDelete = useCallback(
    async (vendorId: number) => {
      if (window.confirm("Are you sure you want to delete this vendor?")) {
        try {
          const response = await fetch(`/api/vendors/${vendorId}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Error deleting vendor");
          loadVendors();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Deletion failed");
        }
      }
    },
    [loadVendors]
  );

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // Define AgGrid column definitions for vendors
  const columnDefs = useMemo<ColDef<Vendor>[]>(
    () => [
      {
        headerName: "Vendor Name",
        field: "vendorName",
        flex: 1,
        minWidth: 150,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "City",
        field: "vendorCity",
        flex: 1,
        minWidth: 100,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "State",
        field: "vendorState",
        flex: 1,
        minWidth: 100,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "ZIP Code",
        field: "vendorZip",
        flex: 1,
        minWidth: 100,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Phone",
        field: "vendorPhone",
        flex: 1,
        minWidth: 120,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Email",
        field: "vendorEmail",
        flex: 1,
        minWidth: 150,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Contact Person",
        field: "vendorContact",
        flex: 1,
        minWidth: 150,
        filter: "agTextColumnFilter",
      },
      {
        headerName: "Taxable",
        field: "taxable",
        flex: 1,
        minWidth: 80,
        filter: "agTextColumnFilter",
        valueFormatter: (params) => (params.value ? "Yes" : "No"),
      },
      {
        headerName: "Actions",
        field: "id",
        flex: 1,
        minWidth: 150,
        cellRenderer: (params: ICellRendererParams<Vendor>) => (
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push(`/modules/vendors/${params.value}`)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-md transition-colors ${
                !hasWritePermission
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-indigo-200"
              }`}
              disabled={!hasWritePermission}
              title={
                hasWritePermission
                  ? "Edit Vendor"
                  : "You do not have permission to edit vendors"
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
                  ? "Delete Vendor"
                  : "You do not have permission to delete vendors"
              }
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        ),
      },
    ],
    [handleDelete, router]
  );

  if (loading) return <div className="p-6">Loading vendors...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="w-full p-6 bg-white rounded-md shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">Vendor List</h1>
        <button
          onClick={() => router.push("/modules/vendors/new")}
          className={`bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition-colors ${
            !hasWritePermission
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-indigo-700"
          }`}
          disabled={!hasWritePermission}
          title={
            hasWritePermission
              ? "Add Vendor"
              : "You do not have permission to add vendors"
          }
        >
          Add Vendor
        </button>
      </div>

      <div
        className="ag-theme-alpine"
        style={{ height: "calc(100vh - 250px)", width: "100%" }}
      >
        <AgGridReact
          rowData={vendors}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={pageSize}
        />
      </div>
    </div>
  );
}
