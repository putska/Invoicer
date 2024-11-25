// app/projects/[projectId]/equipment/page.tsx

"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import { Equipment } from "../../../types";
import { ColDef } from "ag-grid-community";
import { PermissionContext } from "../../../context/PermissionContext";
import EquipmentFormModal from "../../../components/EquipmentFormModal";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useParams } from "next/navigation";

interface Project {
  id: number;
  name: string;
  // Add other relevant fields if necessary
}

const EquipmentPage: React.FC = () => {
  const router = useRouter();
  const { projectId } = useParams(); // Get projectId from URL
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | undefined>(
    undefined
  );
  const [projectName, setProjectName] = useState<string>("");
  const { hasWritePermission } = useContext(PermissionContext);

  // State for modal visibility and mode
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentEquipment, setCurrentEquipment] =
    useState<Partial<Equipment> | null>(null);

  const fetchCurrentProject = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`); // Fetch specific project
      if (!res.ok) {
        throw new Error(`Error fetching project: ${res.statusText}`);
      }
      const data = await res.json();
      setCurrentProject(data.project);
      if (Array.isArray(data.project) && data.project.length > 0) {
        const project = data.project[0];
        setCurrentProject(project);
        setProjectName(project.name);
      }
    } catch (err) {
      console.error(err);
      // Optionally, set an error state here to display to the user
    }
  }, [projectId]);

  const fetchEquipment = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/equipment?projectId=${projectId}`);
      const data = await res.json();
      setEquipmentList(data.equipment);
    } catch (err) {
      console.log(err);
    }
  }, [projectId]);

  useEffect(() => {
    fetchCurrentProject();
    fetchEquipment();
  }, [fetchEquipment, projectId, fetchCurrentProject]);

  // Update createEquipment to handle both add and edit actions
  const handleSubmitEquipment = async (equipmentData: Partial<Equipment>) => {
    setLoading(true);
    try {
      if (editMode && equipmentData.id) {
        // Update existing equipment
        const response = await fetch(`/api/equipment/${equipmentData.id}`, {
          method: "PUT",
          body: JSON.stringify(equipmentData),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        alert(result.message);
      } else {
        // Create new equipment
        const payload = {
          projectId: Number(projectId),
          ...equipmentData,
        };
        const response = await fetch("/api/equipment", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        alert(result.message);
      }
      fetchEquipment(); // Refresh the equipment list
    } catch (err) {
      console.error("Error in handleSubmitEquipment:", err);
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const deleteEquipmentItem = async (id: number) => {
    try {
      const response = await fetch(`/api/equipment/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();
      alert(result.message);
      fetchEquipment(); // Refresh the equipment list
    } catch (err) {
      console.log(err);
    }
  };

  const handleAddEquipment = () => {
    setCurrentEquipment(null);
    setEditMode(false);
    setShowModal(true);
  };

  const handleEditEquipment = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    setEditMode(true);
    setShowModal(true);
  };

  const columnDefs: ColDef<Equipment>[] = [
    {
      headerName: "Equipment Name",
      field: "equipmentName" as keyof Equipment,
      sortable: true,
      filter: true,
    },
    {
      headerName: "Cost per Day",
      field: "costPerDay" as keyof Equipment,
      valueFormatter: currencyFormatter,
    },
    {
      headerName: "Cost per Week",
      field: "costPerWeek" as keyof Equipment,
      valueFormatter: currencyFormatter,
    },
    {
      headerName: "Cost per Month",
      field: "costPerMonth" as keyof Equipment,
      valueFormatter: currencyFormatter,
    },
    {
      headerName: "Delivery Fee",
      field: "deliveryFee" as keyof Equipment,
      valueFormatter: currencyFormatter,
    },
    {
      headerName: "Pickup Fee",
      field: "pickupFee" as keyof Equipment,
      valueFormatter: currencyFormatter,
    },
    {
      headerName: "Actions",
      field: "actions" as keyof Equipment,
      cellRenderer: (params: any) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditEquipment(params.data)}
            className="text-blue-500 hover:text-blue-700"
            title="Edit Equipment"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => deleteEquipmentItem(params.data.id!)}
            className="text-red-500 hover:text-red-700"
            title="Delete Equipment"
          >
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  const defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  function currencyFormatter(params: any) {
    if (params.value != null) {
      return `$${params.value.toFixed(2)}`;
    } else {
      return "";
    }
  }

  if (!projectId) {
    return <p>Loading...</p>;
  }

  return (
    <div className="w-full">
      <main className="min-h-[90vh] flex items-start">
        <div className="md:w-5/6 w-full h-full p-6">
          <h2 className="text-2xl font-bold">
            Equipment for Project {projectName}
          </h2>
          <p className="opacity-70 mb-4">Manage equipment for your project</p>

          <div className="w-full">
            <h2 className="bg-blue-500 text-white p-2 rounded-t-md">
              Equipment List
            </h2>
            <div className="ag-theme-alpine w-full" style={{ height: 400 }}>
              <AgGridReact
                columnDefs={columnDefs}
                rowData={equipmentList}
                defaultColDef={defaultColDef}
              />
            </div>
          </div>

          <div className="flex flex-col items-start mt-4">
            <button
              className={`bg-blue-500 text-white p-2 rounded-md mb-4 
                  ${
                    !hasWritePermission
                      ? "bg-gray-400 cursor-not-allowed opacity-50"
                      : "hover:bg-blue-700"
                  }`}
              onClick={handleAddEquipment}
              disabled={!hasWritePermission}
              aria-disabled={!hasWritePermission}
              title={
                hasWritePermission
                  ? "Add new equipment"
                  : "You do not have permission to add equipment"
              }
            >
              Add Equipment
            </button>

            {/* Render the modal when showModal is true */}
            {showModal && (
              <EquipmentFormModal
                onClose={() => setShowModal(false)}
                onSubmit={handleSubmitEquipment}
                equipment={currentEquipment} // Pass the current equipment if editing
                isEditMode={editMode} // Indicate if we're in edit mode
              />
            )}

            <button
              onClick={() => router.back()}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EquipmentPage;
