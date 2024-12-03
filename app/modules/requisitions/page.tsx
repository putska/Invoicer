"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import AddEditRequisitionModal from "./AddEditRequisitionModal";
import { Requisition } from "../../types"; // Adjust the import based on your project structure
import { ColDef } from "ag-grid-community";

const RequisitionsPage = () => {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingRequisition, setEditingRequisition] =
    useState<Requisition | null>(null);

  const fetchRequisitions = async () => {
    const response = await fetch("/api/requests");
    const data = await response.json();
    setRequisitions(data.requests);
  };

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const handleAddRequisition = () => {
    setEditingRequisition(null);
    setModalOpen(true);
  };

  const handleEditRequisition = (requisition: Requisition) => {
    setEditingRequisition(requisition);
    setModalOpen(true);
  };

  const handleDeleteRequisition = async (id: number) => {
    if (confirm("Are you sure you want to delete this requisition?")) {
      await fetch(`/api/requests/${id}`, { method: "DELETE" });
      fetchRequisitions(); // Refresh data after deletion
    }
  };

  const columnDefs: ColDef<Requisition>[] = [
    {
      headerName: "Material",
      field: "materialName",
      sortable: true,
      filter: true,
    },
    { headerName: "Quantity", field: "quantity", sortable: true, filter: true },
    {
      headerName: "Requested By",
      field: "userName",
      sortable: true,
      filter: true,
    },
    { headerName: "Status", field: "status", sortable: true, filter: true },
    {
      headerName: "Comments",
      field: "comments",
      cellRenderer: (params: any) => (params.value ? params.value : "N/A"),
    },
    {
      headerName: "Actions",
      cellRenderer: (params: any) => (
        <div className="flex gap-2">
          <button
            className="bg-blue-500 text-white px-2 py-1 rounded"
            onClick={() => handleEditRequisition(params.data)}
          >
            Edit
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleDeleteRequisition(params.data.id)}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="ag-theme-alpine" style={{ height: "80vh", width: "100%" }}>
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Requisitions</h1>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleAddRequisition}
        >
          Add Requisition
        </button>
      </div>
      <AgGridReact
        rowData={requisitions}
        columnDefs={columnDefs}
        pagination={true}
        paginationPageSize={10}
      />
      {isModalOpen && (
        <AddEditRequisitionModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          requisition={editingRequisition}
          onSave={() => {
            setModalOpen(false);
            fetchRequisitions(); // Refresh the grid
          }}
        />
      )}
    </div>
  );
};

export default RequisitionsPage;
