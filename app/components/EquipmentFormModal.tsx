// components/EquipmentFormModal.tsx

import React, { useState, useEffect } from "react";
import { Equipment } from "../types";

interface EquipmentFormModalProps {
  onClose: () => void;
  onSubmit: (equipmentData: Partial<Equipment>) => void;
  equipment?: Partial<Equipment> | null;
  isEditMode?: boolean;
}

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  onClose,
  onSubmit,
  equipment,
  isEditMode = false,
}) => {
  const [equipmentName, setEquipmentName] = useState("");
  const [costPerDay, setCostPerDay] = useState<number | undefined>(undefined);
  const [costPerWeek, setCostPerWeek] = useState<number | undefined>(undefined);
  const [costPerMonth, setCostPerMonth] = useState<number | undefined>(
    undefined
  );
  const [deliveryFee, setDeliveryFee] = useState<number | undefined>(undefined);
  const [pickupFee, setPickupFee] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (equipment && isEditMode) {
      setEquipmentName(equipment.equipmentName || "");
      setCostPerDay(equipment.costPerDay ?? undefined);
      setCostPerWeek(equipment.costPerWeek ?? undefined);
      setCostPerMonth(equipment.costPerMonth ?? undefined);
      setDeliveryFee(equipment.deliveryFee ?? undefined);
      setPickupFee(equipment.pickupFee ?? undefined);
    } else {
      // Reset form fields for adding new equipment
      setEquipmentName("");
      setCostPerDay(undefined);
      setCostPerWeek(undefined);
      setCostPerMonth(undefined);
      setDeliveryFee(undefined);
      setPickupFee(undefined);
    }
  }, [equipment, isEditMode]);

  const handleSubmit = () => {
    const equipmentData: Partial<Equipment> = {
      id: equipment?.id, // Include ID if editing
      equipmentName,
      costPerDay,
      costPerWeek,
      costPerMonth,
      deliveryFee,
      pickupFee,
    };
    onSubmit(equipmentData);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          {isEditMode ? "Edit Equipment" : "Add Equipment"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block font-medium">Equipment Name</label>
            <input
              type="text"
              className="border border-gray-300 p-2 w-full rounded-md"
              value={equipmentName}
              onChange={(e) => setEquipmentName(e.target.value)}
            />
          </div>
          {/* Add input fields for the other equipment properties */}
          <div>
            <label className="block font-medium">Cost per Day</label>
            <input
              type="number"
              className="border border-gray-300 p-2 w-full rounded-md"
              value={costPerDay ?? ""}
              onChange={(e) => setCostPerDay(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label className="block font-medium">Cost per Week</label>
            <input
              type="number"
              className="border border-gray-300 p-2 w-full rounded-md"
              value={costPerWeek ?? ""}
              onChange={(e) => setCostPerWeek(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label className="block font-medium">Cost per Month</label>
            <input
              type="number"
              className="border border-gray-300 p-2 w-full rounded-md"
              value={costPerMonth ?? ""}
              onChange={(e) => setCostPerMonth(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label className="block font-medium">Delivery Fee</label>
            <input
              type="number"
              className="border border-gray-300 p-2 w-full rounded-md"
              value={deliveryFee ?? ""}
              onChange={(e) => setDeliveryFee(parseFloat(e.target.value))}
            />
          </div>
          <div>
            <label className="block font-medium">Pickup Fee</label>
            <input
              type="number"
              className="border border-gray-300 p-2 w-full rounded-md"
              value={pickupFee ?? ""}
              onChange={(e) => setPickupFee(parseFloat(e.target.value))}
            />
          </div>
        </div>
        <div className="flex justify-end space-x-4 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            {isEditMode ? "Update" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentFormModal;
