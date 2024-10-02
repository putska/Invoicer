import React, { useState } from "react";
import { Equipment } from "../../../types";

interface EquipmentFormModalProps {
  onClose: () => void;
  onSubmit: (equipmentData: Partial<Equipment>) => void;
  equipment?: Partial<Equipment>;
  isEditMode: boolean;
}

const EquipmentFormModal: React.FC<EquipmentFormModalProps> = ({
  onClose,
  onSubmit,
  equipment,
  isEditMode,
}) => {
  const [formData, setFormData] = useState<Partial<Equipment>>({
    equipmentName: equipment?.equipmentName || "",
    costPerDay: equipment?.costPerDay || 0,
    costPerWeek: equipment?.costPerWeek || 0,
    costPerMonth: equipment?.costPerMonth || 0,
    deliveryFee: equipment?.deliveryFee || 0,
    pickupFee: equipment?.pickupFee || 0,
    notes: equipment?.notes || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...equipment, ...formData });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-md w-96">
        <h2 className="text-xl font-bold mb-4">
          {isEditMode ? "Edit Equipment" : "Add Equipment"}
        </h2>
        <form onSubmit={handleSubmit}>
          {/* Equipment Name */}
          <div className="mb-2">
            <label className="block">Equipment Name</label>
            <input
              type="text"
              name="equipmentName"
              value={formData.equipmentName}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          {/* Cost per Day */}
          <div className="mb-2">
            <label className="block">Cost per Day</label>
            <input
              type="number"
              name="costPerDay"
              value={formData.costPerDay}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          {/* Cost per Week */}
          <div className="mb-2">
            <label className="block">Cost per Week</label>
            <input
              type="number"
              name="costPerWeek"
              value={formData.costPerWeek}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          {/* Cost per Month */}
          <div className="mb-2">
            <label className="block">Cost per Month</label>
            <input
              type="number"
              name="costPerMonth"
              value={formData.costPerMonth}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          {/* Delivery Fee */}
          <div className="mb-2">
            <label className="block">Delivery Fee</label>
            <input
              type="number"
              name="deliveryFee"
              value={formData.deliveryFee}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          {/* Pickup Fee */}
          <div className="mb-2">
            <label className="block">Pickup Fee</label>
            <input
              type="number"
              name="pickupFee"
              value={formData.pickupFee}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>
          {/* Notes */}
          <div className="mb-4">
            <label className="block">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            />
          </div>
          {/* Buttons */}
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {isEditMode ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EquipmentFormModal;
