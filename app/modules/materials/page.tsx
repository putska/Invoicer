"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import AddEditMaterialModal from "./AddEditMaterialModal";
import { Material, Project } from "../../types"; // Adjust the import based on your project structure
import { ColDef } from "ag-grid-community"; // Ensure you import this from ag-grid
import { getUserId } from "../../api/admin/helpers";

const MaterialsPage = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [selectedRows, setSelectedRows] = useState<Material[]>([]);
  const [selectedJob, setSelectedJob] = useState<number | null>(null);

  const isCheckoutDisabled =
    !selectedJob ||
    !materials.some(
      (row) => row.requisitionQuantity && row.requisitionQuantity > 0
    );

  // Fetch materials and projects
  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/materials");
      const data = await response.json();
      setMaterials(
        data.materials.map((material: Material) => ({
          ...material,
          requisitionQuantity: 0, // Default value
        }))
      );
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    fetchMaterials();
    fetchProjects();
  }, []);

  // Handle selection change in the grid
  const onSelectionChanged = (event: any) => {
    const selectedData = event.api.getSelectedRows();
    setSelectedRows(selectedData);
  };

  // Handle cart submission
  const handleSubmitCart = async () => {
    try {
      // Fetch the internal user ID via the API route
      const userIdResponse = await fetch("/api/auth/userId");
      if (!userIdResponse.ok) {
        const error = await userIdResponse.json();
        console.error("Error fetching user ID:", error.message);
        alert("Failed to authenticate user. Please log in.");
        return;
      }

      const { userId: internalUserId } = await userIdResponse.json();

      // Prepare cart items
      const cartItems = materials
        .filter((row) => row.requisitionQuantity && row.requisitionQuantity > 0)
        .map((row) => ({
          materialId: row.id,
          quantity: row.requisitionQuantity,
          requestedBy: internalUserId, // Use the internal user ID
          status: "requested",
          jobId: selectedJob,
          comments: "",
        }));

      if (cartItems.length === 0) {
        alert("No valid items to requisition.");
        return;
      }

      // Submit the cart
      const submitResponse = await fetch("/api/requests/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cartItems),
      });

      if (submitResponse.ok) {
        alert("Requisitions submitted successfully!");
        setMaterials((prev) =>
          prev.map((row) => ({ ...row, requisitionQuantity: 0 }))
        ); // Reset requisition quantities
      } else {
        const errorData = await submitResponse.json();
        alert(`Failed to submit requisitions: ${errorData.message}`);
      }
    } catch (error) {
      console.error("Error submitting requisitions:", error);
      alert("An unexpected error occurred.");
    }
  };

  // Handle modal open/close
  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setModalOpen(true);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setModalOpen(true);
  };

  const handleDeleteMaterial = async (id: number) => {
    if (confirm("Are you sure you want to delete this material?")) {
      await fetch(`/api/materials/${id}`, { method: "DELETE" });
      setMaterials(materials.filter((material) => material.id !== id));
    }
  };

  // Define grid columns
  const columnDefs: ColDef<Material>[] = [
    { headerName: "Name", field: "name", sortable: true, filter: true },
    {
      headerName: "Description",
      field: "description",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Quantity Available",
      field: "quantity",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Quantity to Requisition",
      field: "requisitionQuantity",
      editable: true, // Make this column editable
      valueSetter: (params: any) => {
        const value = parseInt(params.newValue, 10);
        if (isNaN(value) || value < 0) {
          return false; // Reject invalid values
        }
        params.data.requisitionQuantity = value;
        return true;
      },
    },
    { headerName: "Unit", field: "unit", sortable: true, filter: true },
    {
      headerName: "Photo",
      field: "photoUrl",
      cellRenderer: (params: any) =>
        params.value ? (
          <img
            src={params.value}
            alt="Material"
            className="w-full h-full object-contain max-h-24" // Ensure the image fits within the row
          />
        ) : (
          "N/A"
        ),
    },
    {
      headerName: "Actions",
      cellRenderer: (params: any) => (
        <div className="flex gap-2">
          <button
            className="bg-blue-500 text-white px-2 py-1 rounded"
            onClick={() => handleEditMaterial(params.data)}
          >
            Edit
          </button>
          <button
            className="bg-red-500 text-white px-2 py-1 rounded"
            onClick={() => handleDeleteMaterial(params.data.id)}
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
        <h1 className="text-2xl font-bold">Materials</h1>
        <button
          className="bg-green-500 text-white px-4 py-2 rounded"
          onClick={handleAddMaterial}
        >
          Add Material
        </button>
      </div>
      {/* Jobsite Dropdown */}
      <div className="mb-4">
        <label className="block mb-2">
          Jobsite:
          <select
            className="border p-2 w-full"
            value={selectedJob ?? ""}
            onChange={(e) => setSelectedJob(Number(e.target.value))}
          >
            <option value="" disabled>
              Select a jobsite
            </option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={handleSubmitCart}
          className={`px-4 py-2 rounded mt-4 ${
            isCheckoutDisabled
              ? "bg-gray-500 text-gray-300 cursor-not-allowed"
              : "bg-green-500 text-white"
          }`}
          disabled={isCheckoutDisabled}
        >
          Check Out
        </button>
      </div>

      {/* Materials Grid */}
      <AgGridReact
        rowData={materials}
        columnDefs={columnDefs}
        onSelectionChanged={onSelectionChanged}
        pagination={true}
        paginationPageSize={20}
      />

      {isModalOpen && (
        <AddEditMaterialModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          material={editingMaterial}
          onSave={(newMaterial) => {
            fetchMaterials();
            setMaterials((prev) =>
              editingMaterial
                ? prev.map((mat) =>
                    mat.id === newMaterial.id ? newMaterial : mat
                  )
                : [...prev, newMaterial]
            );
            setModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MaterialsPage;
