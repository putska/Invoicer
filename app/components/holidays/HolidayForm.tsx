// components/holidays/HolidayForm.tsx
"use client";

import { useState, useEffect } from "react";
import type { Holiday, HolidayType } from "../../types";

interface HolidayFormProps {
  holiday?: Holiday;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function HolidayForm({
  holiday,
  onSuccess,
  onCancel,
}: HolidayFormProps) {
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    description: "",
    type: "both" as HolidayType,
    isRecurring: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when holiday prop changes
  useEffect(() => {
    if (holiday) {
      setFormData({
        date: holiday.date || "",
        name: holiday.name || "",
        description: holiday.description || "",
        type: holiday.type || "both",
        isRecurring: holiday.isRecurring || false,
      });
    } else {
      // Reset form for new holiday
      setFormData({
        date: "",
        name: "",
        description: "",
        type: "both",
        isRecurring: false,
      });
    }
    // Clear any previous errors
    setErrors({});
  }, [holiday]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date.trim()) {
      newErrors.date = "Date is required";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Holiday name is required";
    }

    if (!formData.type) {
      newErrors.type = "Holiday type is required";
    }

    // Validate date format
    if (formData.date && !/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      newErrors.date = "Please enter a valid date";
    }

    // Check if date is in the past (optional validation)
    if (formData.date) {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today && !holiday) {
        // Only warn for new holidays, not when editing existing ones
        newErrors.date = "Warning: This date is in the past";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      let response;

      if (holiday) {
        // Update existing holiday
        response = await fetch(`/api/holidays/${holiday.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new holiday
        response = await fetch("/api/holidays", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });
      }

      const result = await response.json();

      if (response.ok) {
        onSuccess();
      } else {
        // Handle specific API errors
        if (response.status === 401) {
          setErrors({
            general: "You are not authorized to perform this action",
          });
        } else if (response.status === 403) {
          setErrors({
            general: "You do not have permission to manage holidays",
          });
        } else {
          setErrors({ general: result.message || "An error occurred" });
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrors({
        general: "Network error. Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear field-specific errors when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCancel = () => {
    // Reset form and clear errors
    setFormData({
      date: "",
      name: "",
      description: "",
      type: "both",
      isRecurring: false,
    });
    setErrors({});
    onCancel();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {holiday ? "Edit Holiday" : "Add New Holiday"}
        </h2>
        <button
          onClick={handleCancel}
          className="text-gray-400 hover:text-gray-600"
          disabled={isSubmitting}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="date"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.date ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Holiday Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="e.g., Christmas Day, Memorial Day"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            placeholder="Optional description or notes about this holiday"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Holiday Type <span className="text-red-500">*</span>
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            required
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.type ? "border-red-300 bg-red-50" : "border-gray-300"
            }`}
          >
            <option value="both">Both (Office & Field)</option>
            <option value="office">Office Only</option>
            <option value="field">Field Only</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            Select who this holiday applies to
          </p>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="isRecurring"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="isRecurring" className="font-medium text-gray-700">
              Recurring Holiday
            </label>
            <p className="text-gray-500">
              Check this if this holiday occurs annually
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={
              isSubmitting ||
              Object.keys(errors).some(
                (key) => key !== "general" && errors[key]
              )
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isSubmitting && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isSubmitting
              ? "Saving..."
              : holiday
              ? "Update Holiday"
              : "Create Holiday"}
          </button>
        </div>
      </form>
    </div>
  );
}
