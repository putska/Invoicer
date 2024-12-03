"use client";

import React, { useState, useEffect } from "react";
import { Material, Requisition, User } from "../../types";

const AddEditRequisitionModal = ({
  isOpen,
  onClose,
  requisition,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  requisition: Requisition | null;
  onSave: (req: Requisition) => void;
}) => {
  const [formData, setFormData] = useState({
    materialId: requisition?.materialId || "",
    quantity: requisition?.quantity || 1,
    requestedBy: requisition?.requestedBy || "",
    status: requisition?.status || "requested",
    comments: requisition?.comments || "",
  });

  const [materials, setMaterials] = useState<Material[]>([]);
  const [users, setUsers] = useState<User[]>([]); // To store user data for the dropdown

  // Fetch materials for the dropdown
  useEffect(() => {
    const fetchMaterials = async () => {
      const response = await fetch("/api/materials");
      const data = await response.json();
      setMaterials(data.materials);
    };
    fetchMaterials();
  }, []);

  // Fetch users for the "Requested By" dropdown
  useEffect(() => {
    const fetchUsers = async () => {
      const response = await fetch("/api/users"); // Ensure this endpoint returns all users
      const data = await response.json();
      setUsers(data.users);
    };
    fetchUsers();
  }, []);

  // Update formData when requisition changes (e.g., when editing a new record)
  useEffect(() => {
    if (requisition) {
      setFormData({
        materialId: requisition.materialId
          ? requisition.materialId.toString()
          : "",
        quantity: requisition.quantity || 1,
        requestedBy: requisition.requestedBy || "",
        status: requisition.status || "requested",
        comments: requisition.comments || "",
      });
    }
  }, [requisition]);

  const handleSubmit = async () => {
    const method = requisition ? "PUT" : "POST";
    const url = requisition
      ? `/api/requests/${requisition.id}`
      : "/api/requests";
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await response.json();
    onSave(data);
  };

  return isOpen ? (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg">
        <h2 className="text-xl font-bold mb-4">
          {requisition ? "Edit Requisition" : "Add Requisition"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          {/* Dropdown for materials */}
          <label className="block mb-2">
            Material:
            <select
              className="border p-2 w-full"
              value={formData.materialId}
              onChange={(e) =>
                setFormData({ ...formData, materialId: e.target.value })
              }
            >
              <option value="" disabled>
                Select a material
              </option>
              {materials.map((material) => (
                <option
                  key={material.id ?? ""}
                  value={material.id?.toString() ?? ""}
                >
                  {material.name}
                </option>
              ))}
            </select>
          </label>

          {/* Dropdown for requested by */}
          <label className="block mb-2">
            Requested By:
            <select
              className="border p-2 w-full"
              value={formData.requestedBy}
              onChange={(e) =>
                setFormData({ ...formData, requestedBy: e.target.value })
              }
            >
              <option value="" disabled>
                Select a user
              </option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </label>

          {/* Other form fields */}
          <label className="block mb-2">
            Quantity:
            <input
              type="number"
              className="border p-2 w-full"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: +e.target.value })
              }
            />
          </label>
          <label className="block mb-2">
            Status:
            <select
              className="border p-2 w-full"
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as
                    | "requested"
                    | "delivered"
                    | "canceled",
                })
              }
            >
              <option value="requested">Requested</option>
              <option value="delivered">Delivered</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
          <label className="block mb-2">
            Comments:
            <textarea
              className="border p-2 w-full"
              value={formData.comments}
              onChange={(e) =>
                setFormData({ ...formData, comments: e.target.value })
              }
            />
          </label>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  ) : null;
};

export default AddEditRequisitionModal;
