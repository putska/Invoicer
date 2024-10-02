// app/projects/[projectId]/equipment/page.tsx

"use client";
import React, { useState, useEffect, useCallback, useContext } from "react";
import { useRouter } from "next/navigation";
import { AgGridReact } from "ag-grid-react";
import { Equipment } from "../../../../../types";
import { PermissionContext } from "../../../../context/PermissionContext";
import EquipmentFormModal from "../../../components/EquipmentFormModal";
import { FaEdit, FaTrash } from "react-icons/fa";
import { useParams } from "next/navigation";

const EquipmentPage: React.FC = () => {
  const router = useRouter();
  const { projectId } = useParams(); // Get projectId from URL
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { hasWritePermission } = useContext(PermissionContext);

  // State for modal visibility and mode
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentEquipment, setCurrentEquipment] =
    useState<Partial<Equipment> | null>(null);

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
    fetchEquipment();
  }, [fetchEquipment]);

  const createEquipment = async (equipmentData: Partial<Equipment>) => {
    setLoading(true);
    try {
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

      console.log("Response status:", response.status);
      console.log("Response headers:", response.headers);

      const responseText = await response.text();
      console.log("Response text:", responseText);

      const result = JSON.parse(responseText);
      alert(result.message);
      fetchEquipment(); // Refresh the equipment list
    } catch (err) {
      console.error("Error in createEquipment:", err);
    } finally {
      setLoading(false);
      setShowModal(false);
    }
  };

  const updateEquipmentItem = async (equipmentData: Partial<Equipment>) => {
    if (!equipmentData.id) return; // Ensure the equipment has an ID
    setLoading(true);
    try {
      const payload = {
        ...equipmentData,
      };
      const response = await fetch(`/api/equipment/${equipmentData.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const result = await response.json();
      alert(result.message);
      fetchEquipment(); // Refresh the equipment list
    } catch (err) {
      console.log(err);
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

  const columnDefs = [
    {
      headerName: "Equipment Name",
      field: "equipmentName",
      sortable: true,
      filter: true,
    },
    {
      headerName: "Cost per Day",
      field: "costPerDay",
      valueFormatter: currencyFormatter,
    },
    {
      headerName: "Cost per Week",
      field: "costPerWeek",
      valueFormatter: currencyFormatter,
    },
    {
      headerName: "Cost per Month",
      field: "costPerMonth",
      valueFormatter: currencyFormatter,
    },
    {
      headerName: "Delivery Fee",
      field: "deliveryFee",
      valueFormatter: currencyFormatter,
    },
    {
      headerName: "Pickup Fee",
      field: "pickupFee",
      valueFormatter: currencyFormatter,
    },
    {
      headerName: "Actions",
      field: "actions",
      cellRendererFramework: (params: any) => (
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
            Equipment for Project {projectId}
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
                onSubmit={editMode ? updateEquipmentItem : createEquipment}
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
