"use client";

import React, { useState, useEffect, useContext } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import AddEditRequisitionModal from "./AddEditRequisitionModal";
import { Requisition } from "../../types"; // Adjust the import based on your project structure
import { ColDef } from "ag-grid-community";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { PermissionContext } from "../../context/PermissionContext";

const RequisitionsPage = () => {
  const { hasWritePermission, isLoaded } = useContext(PermissionContext);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingRequisition, setEditingRequisition] =
    useState<Requisition | null>(null);

  // Show a loading message until permissions are loaded
  if (!isLoaded) {
    return <div className="p-6">Loading permissions...</div>;
  }

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
      headerName: "Requisition ID",
      field: "id",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Job Name",
      field: "jobName",
      sortable: true,
      filter: true,
    },
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
          <div className="flex items-center gap-2 py-1">
            <button
              onClick={() => handleEditRequisition(params.data)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-100 text-indigo-700 rounded-md transition-colors ${
                !hasWritePermission
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-indigo-200"
              }`}
              disabled={!hasWritePermission}
              title={
                hasWritePermission
                  ? "Edit Requisitions"
                  : "You do not have permission to edit requisitions"
              }
            >
              <PencilSquareIcon className="w-4 h-4" />
              Edit
            </button>

            <button
              onClick={() => handleDeleteRequisition(params.data.id)}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-md transition-colors ${
                !hasWritePermission
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-red-200"
              }`}
              disabled={!hasWritePermission}
              title={
                hasWritePermission
                  ? "Delete Requisition"
                  : "You do not have permission to delete requisitions"
              }
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full p-6 bg-white rounded-md shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">Requisitions</h1>
        <button
          onClick={handleAddRequisition}
          className={`bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md transition-colors ${
            !hasWritePermission
              ? "cursor-not-allowed opacity-50"
              : "hover:bg-indigo-700"
          }`}
          disabled={!hasWritePermission}
          title={
            hasWritePermission
              ? "Add Requisition"
              : "You do not have permission to add requisitions"
          }
        >
          Add Requisition
        </button>
      </div>
      <div
        className="ag-theme-alpine"
        style={{ height: "calc(100vh - 250px)", width: "100%" }}
      >
        <AgGridReact
          rowData={requisitions}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={10}
        />
      </div>
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
