"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import AddEditMaterialModal from "./AddEditMaterialModal";
import { Material } from "../types"; // Adjust the import based on your project structure
import { ColDef } from "ag-grid-community"; // Ensure you import this from ag-grid

const MaterialsPage = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  // Fetch materials from the API
  useEffect(() => {
    const fetchMaterials = async () => {
      const response = await fetch("/api/materials");
      const data = await response.json();
      setMaterials(data.materials);
    };
    fetchMaterials();
  }, []);

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
    { headerName: "Quantity", field: "quantity", sortable: true, filter: true },
    { headerName: "Unit", field: "unit", sortable: true, filter: true },
    {
      headerName: "Photo",
      field: "photoUrl",
      cellRenderer: (params: any) =>
        params.value ? (
          <img src={params.value} alt="Material" className="w-16 h-16" />
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
      <AgGridReact
        rowData={materials}
        columnDefs={columnDefs}
        pagination={true}
        paginationPageSize={10}
      />
      {isModalOpen && (
        <AddEditMaterialModal
          isOpen={isModalOpen}
          onClose={() => setModalOpen(false)}
          material={editingMaterial}
          onSave={(newMaterial) => {
            console.log("New Material:", newMaterial); // Debugging line
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
