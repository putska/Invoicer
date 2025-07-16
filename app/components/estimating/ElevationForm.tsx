"use client";

import React, { useState } from "react";
import { CreateElevationInput, Elevation } from "../../types";

interface ElevationFormProps {
  bidId: number;
  onSubmit: (data: CreateElevationInput) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<CreateElevationInput>;
  isEditing?: boolean;
}

const ElevationForm: React.FC<ElevationFormProps> = ({
  bidId,
  onSubmit,
  onCancel,
  initialData,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<CreateElevationInput>({
    bidId,
    name: initialData?.name || "",
    description: initialData?.description || "",
    elevationType: initialData?.elevationType || "storefront",
    totalWidth: initialData?.totalWidth || 0,
    totalHeight: initialData?.totalHeight || 0,
    floorHeight: initialData?.floorHeight || 0,
    floorNumber: initialData?.floorNumber || 1,
    drawingNumber: initialData?.drawingNumber || "",
    drawingRevision: initialData?.drawingRevision || "",
    gridLine: initialData?.gridLine || "",
    detailReference: initialData?.detailReference || "",
    notes: initialData?.notes || "",
    sortOrder: initialData?.sortOrder || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Elevation name is required";
    }

    if (formData.totalWidth <= 0) {
      newErrors.totalWidth = "Total width must be greater than 0";
    }

    if (formData.totalHeight <= 0) {
      newErrors.totalHeight = "Total height must be greater than 0";
    }

    if (formData.floorHeight < 0) {
      newErrors.floorHeight = "Floor height cannot be negative";
    }

    if ((formData.floorNumber ?? 0) < 1) {
      newErrors.floorNumber = "Floor number must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle numeric fields
    if (
      [
        "totalWidth",
        "totalHeight",
        "floorHeight",
        "floorNumber",
        "sortOrder",
      ].includes(name)
    ) {
      const numericValue = parseFloat(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting elevation:", error);
      // Handle error (maybe show a toast notification)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? "Edit Elevation" : "Create New Elevation"}
      </h2>

      <div className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Elevation Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., North Elevation, Storefront A"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="elevationType"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Elevation Type
            </label>
            <select
              id="elevationType"
              name="elevationType"
              value={formData.elevationType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="storefront">Storefront</option>
              <option value="curtain_wall">Curtain Wall</option>
              <option value="window_wall">Window Wall</option>
              <option value="entrance">Entrance</option>
              <option value="canopy">Canopy</option>
              <option value="mixed">Mixed</option>
            </select>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="totalWidth"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Total Width (feet) *
            </label>
            <input
              type="number"
              id="totalWidth"
              name="totalWidth"
              value={formData.totalWidth}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.totalWidth ? "border-red-500" : "border-gray-300"
              }`}
              step="0.1"
              min="0.1"
              placeholder="0.0"
            />
            {errors.totalWidth && (
              <p className="mt-1 text-sm text-red-600">{errors.totalWidth}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="totalHeight"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Total Height (feet) *
            </label>
            <input
              type="number"
              id="totalHeight"
              name="totalHeight"
              value={formData.totalHeight}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.totalHeight ? "border-red-500" : "border-gray-300"
              }`}
              step="0.1"
              min="0.1"
              placeholder="0.0"
            />
            {errors.totalHeight && (
              <p className="mt-1 text-sm text-red-600">{errors.totalHeight}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="floorHeight"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Floor Height (feet) *
            </label>
            <input
              type="number"
              id="floorHeight"
              name="floorHeight"
              value={formData.floorHeight}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.floorHeight ? "border-red-500" : "border-gray-300"
              }`}
              step="0.1"
              min="0"
              placeholder="0.0"
            />
            {errors.floorHeight && (
              <p className="mt-1 text-sm text-red-600">{errors.floorHeight}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Height from floor to bottom of glazing
            </p>
          </div>

          <div>
            <label
              htmlFor="floorNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Floor Number
            </label>
            <input
              type="number"
              id="floorNumber"
              name="floorNumber"
              value={formData.floorNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.floorNumber ? "border-red-500" : "border-gray-300"
              }`}
              min="1"
              placeholder="1"
            />
            {errors.floorNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.floorNumber}</p>
            )}
          </div>
        </div>

        {/* Drawing References */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="drawingNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Drawing Number
            </label>
            <input
              type="text"
              id="drawingNumber"
              name="drawingNumber"
              value={formData.drawingNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., A-101"
            />
          </div>

          <div>
            <label
              htmlFor="drawingRevision"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Drawing Revision
            </label>
            <input
              type="text"
              id="drawingRevision"
              name="drawingRevision"
              value={formData.drawingRevision}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Rev A"
            />
          </div>

          <div>
            <label
              htmlFor="gridLine"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Grid Line
            </label>
            <input
              type="text"
              id="gridLine"
              name="gridLine"
              value={formData.gridLine}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., A-F / 1-5"
            />
          </div>
        </div>

        {/* Additional References */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="detailReference"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Detail Reference
            </label>
            <input
              type="text"
              id="detailReference"
              name="detailReference"
              value={formData.detailReference}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Detail 3/A-501"
            />
          </div>

          <div>
            <label
              htmlFor="sortOrder"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Sort Order
            </label>
            <input
              type="number"
              id="sortOrder"
              name="sortOrder"
              value={formData.sortOrder}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min="0"
            />
          </div>
        </div>

        {/* Description and Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional description of this elevation..."
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes or specifications..."
            />
          </div>
        </div>

        {/* Preview Section */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Preview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Name:</span>
              <p>{formData.name || "Untitled Elevation"}</p>
            </div>
            <div>
              <span className="font-medium">Type:</span>
              <p>
                {formData.elevationType?.replace("_", " ") || "Not specified"}
              </p>
            </div>
            <div>
              <span className="font-medium">Dimensions:</span>
              <p>
                {formData.totalWidth}' × {formData.totalHeight}'
              </p>
            </div>
            <div>
              <span className="font-medium">Floor:</span>
              <p>Level {formData.floorNumber}</p>
            </div>
            <div>
              <span className="font-medium">Floor Height:</span>
              <p>{formData.floorHeight}'</p>
            </div>
            <div>
              <span className="font-medium">Glazing Height:</span>
              <p>{formData.totalHeight.toFixed(1)}'</p>
            </div>
            <div>
              <span className="font-medium">Total Area:</span>
              <p>
                {(formData.totalWidth * formData.totalHeight).toFixed(1)} sq ft
              </p>
            </div>
            <div>
              <span className="font-medium">Drawing:</span>
              <p>{formData.drawingNumber || "Not specified"}</p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
                  xmlns="http://www.w3.org/2000/svg"
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
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : isEditing ? (
              "Update Elevation"
            ) : (
              "Create Elevation"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ElevationForm;
