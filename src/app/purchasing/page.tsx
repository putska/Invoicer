// /app/purchasing/page.tsx
"use client";
import { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { ColDef } from "ag-grid-community";

type PurchaseOrder = {
  id: number;
  jobNumber: string;
  shortDescription: string;
  vendorName: string;
  totalAmount: number;
  status: string;
};

export default function PurchaseOrderListPage() {
  const [rowData, setRowData] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(50); // Pagination size

  const columnDefs: ColDef<PurchaseOrder>[] = [
    { headerName: "Job Number", field: "jobNumber", sortable: true },
    { headerName: "Description", field: "shortDescription", sortable: true },
    { headerName: "Vendor", field: "vendorName", sortable: true },
    { headerName: "Total Amount", field: "totalAmount", sortable: true },
    { headerName: "Status", field: "status", sortable: true },
    {
      headerName: "Actions",
      field: "id",
      cellRenderer: (params: any) => {
        return (
          <div>
            <button
              className="bg-indigo-600 text-white px-3 py-1 rounded-md mr-2"
              onClick={() =>
                (window.location.href = `/purchasing/${params.value}`)
              }
            >
              Edit
            </button>
            <button
              className="bg-red-600 text-white px-3 py-1 rounded-md"
              onClick={() => handleDelete(params.value)}
            >
              Delete
            </button>
          </div>
        );
      },
    },
  ];

  // Fetch PO data
  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/purchasing");
      if (!response.ok) throw new Error("Error fetching purchase orders");
      const data = await response.json();
      setRowData(data.purchaseOrders); // Assume API returns { purchaseOrders: [...] }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Delete PO
  const handleDelete = async (poId: number) => {
    if (
      window.confirm("Are you sure you want to delete this purchase order?")
    ) {
      try {
        const response = await fetch(`/api/purchasing/${poId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Error deleting purchase order");
        loadPurchaseOrders(); // Reload the data after deletion
      } catch (err) {
        setError((err as Error).message);
      }
    }
  };

  useEffect(() => {
    loadPurchaseOrders();
  }, []);

  if (loading) return <div>Loading purchase orders...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-md shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">
          Purchase Orders
        </h1>
        <button
          onClick={() => (window.location.href = "/purchasing/new")} // Add PO button
          className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring focus:ring-indigo-100"
        >
          Add Purchase Order
        </button>
      </div>

      <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={pageSize}
        />
      </div>
    </div>
  );
}
