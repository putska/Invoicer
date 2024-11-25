import React, { useState } from "react";
import { Material } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  material: Material | null;
  onSave: (material: Material) => void;
}

const AddEditMaterialModal: React.FC<Props> = ({
  isOpen,
  onClose,
  material,
  onSave,
}) => {
  const [formData, setFormData] = useState<Partial<Material>>(
    material || {
      name: "",
      description: "",
      quantity: 0,
      unit: "",
      photoUrl: "",
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = material ? "PUT" : "POST";
    const url = material ? `/api/materials/${material.id}` : "/api/materials";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save material");
      }

      const savedMaterial = await response.json(); // Ensure the API returns the material
      onSave(savedMaterial); // Pass the saved material back to the parent
    } catch (error) {
      console.error("Error saving material:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 shadow-lg w-1/3">
        <h2 className="text-xl font-bold mb-4">
          {material ? "Edit Material" : "Add Material"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name || ""}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity || 0}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Unit</label>
            <input
              type="text"
              name="unit"
              value={formData.unit || ""}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium">Photo URL</label>
            <input
              type="text"
              name="photoUrl"
              value={formData.photoUrl || ""}
              onChange={handleChange}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEditMaterialModal;
