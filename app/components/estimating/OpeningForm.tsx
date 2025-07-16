// Enhanced OpeningForm with Grid Definition

"use client";

import React, { useState, useEffect } from "react";
import { Grid, Eye, EyeOff, RotateCcw } from "lucide-react";
import { CreateOpeningInput, OpeningWithDetails } from "../../types";

// New types for grid definition
interface GridDefinition {
  columns: number;
  rows: number;
  mullionWidth: number; // Visual width in elevation (typically 2.5")
  spacing: {
    vertical: "equal" | "custom";
    horizontal: "equal" | "custom";
  };
  components: {
    sill: string; // Component names for mapping
    head: string;
    jambs: string;
    verticals: string;
    horizontals: string;
  };
}

interface OpeningFormProps {
  elevationId: number;
  opening?: OpeningWithDetails | null;
  onSubmit: (
    data: CreateOpeningInput | Partial<CreateOpeningInput>
  ) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const OpeningForm: React.FC<OpeningFormProps> = ({
  elevationId,
  opening,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const isEditing = !!opening;

  // Basic opening data
  const [formData, setFormData] = useState<CreateOpeningInput>({
    elevationId,
    name: opening?.name || "",
    openingMark: opening?.openingMark || "",
    startPosition: opening?.startPosition || "0",
    width: opening?.width || "0",
    height: opening?.height || "0",
    sillHeight: opening?.sillHeight || "0",
    openingType: opening?.openingType || "window",
    hasTransom: opening?.hasTransom || false,
    transomHeight: opening?.transomHeight || "",
    description: opening?.description || "",
    totalMaterialCost: opening?.totalMaterialCost || "0",
    totalLaborCost: opening?.totalLaborCost || "0",
  });

  // Grid definition state
  const [gridDefinition, setGridDefinition] = useState<GridDefinition>({
    columns: opening?.gridColumns || 2,
    rows: opening?.gridRows || 2,
    mullionWidth:
      typeof opening?.mullionWidth === "string"
        ? parseFloat(opening.mullionWidth) || 2.5
        : opening?.mullionWidth || 2.5,
    spacing: {
      vertical: "equal",
      horizontal: "equal",
    },
    components: {
      sill: opening?.componentSill || "Sill",
      head: opening?.componentHead || "Head",
      jambs: opening?.componentJambs || "Jamb",
      verticals: opening?.componentVerticals || "Vertical",
      horizontals: opening?.componentHorizontals || "Horizontal",
    },
  });

  const [showGridPreview, setShowGridPreview] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Opening name is required";
    }

    if (parseFloat(String(formData.width)) <= 0) {
      newErrors.width = "Width must be greater than 0";
    }

    if (parseFloat(String(formData.height)) <= 0) {
      newErrors.height = "Height must be greater than 0";
    }

    if (parseFloat(String(formData.sillHeight)) < 0) {
      newErrors.sillHeight = "Sill height cannot be negative";
    }

    if (gridDefinition.columns < 1 || gridDefinition.columns > 20) {
      newErrors.columns = "Columns must be between 1 and 20";
    }

    if (gridDefinition.rows < 1 || gridDefinition.rows > 20) {
      newErrors.rows = "Rows must be between 1 and 20";
    }

    if (gridDefinition.mullionWidth <= 0 || gridDefinition.mullionWidth > 6) {
      newErrors.mullionWidth = "Mullion width must be between 0 and 6 inches";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    } else if (
      ["width", "height", "sillHeight", "startPosition"].includes(name)
    ) {
      const numericValue = parseFloat(value) || 0;
      setFormData((prev) => ({ ...prev, [name]: numericValue.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleGridChange = (field: string, value: any) => {
    if (field.startsWith("component_")) {
      const componentKey = field.replace("component_", "");
      setGridDefinition((prev) => ({
        ...prev,
        components: {
          ...prev.components,
          [componentKey]: value,
        },
      }));
    } else {
      setGridDefinition((prev) => ({ ...prev, [field]: value }));
    }

    // Clear error when user changes value
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const resetGridToDefaults = () => {
    setGridDefinition({
      columns: 2,
      rows: 2,
      mullionWidth: 2.5,
      spacing: { vertical: "equal", horizontal: "equal" },
      components: {
        sill: "Sill",
        head: "Head",
        jambs: "Jamb",
        verticals: "Vertical",
        horizontals: "Horizontal",
      },
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Combine form data with grid definition
      const submitData = {
        ...formData,
        // Add grid fields to the opening data
        gridColumns: gridDefinition.columns,
        gridRows: gridDefinition.rows,
        mullionWidth: gridDefinition.mullionWidth.toString(),
        spacingVertical: gridDefinition.spacing.vertical,
        spacingHorizontal: gridDefinition.spacing.horizontal,
        componentSill: gridDefinition.components.sill,
        componentHead: gridDefinition.components.head,
        componentJambs: gridDefinition.components.jambs,
        componentVerticals: gridDefinition.components.verticals,
        componentHorizontals: gridDefinition.components.horizontals,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting opening:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate grid preview dimensions
  const previewWidth = 300;
  const previewHeight = 200;
  const openingWidth = parseFloat(String(formData.width)) || 1;
  const openingHeight = parseFloat(String(formData.height)) || 1;
  const scale = Math.min(
    previewWidth / openingWidth,
    previewHeight / openingHeight,
    20
  );
  const scaledWidth = openingWidth * scale;
  const scaledHeight = openingHeight * scale;

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? "Edit Opening" : "Create New Opening"}
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Basic Opening Information */}
        <div className="xl:col-span-2 space-y-6">
          {/* Basic Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Opening Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Window W1, Curtain Wall CW-1"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="openingMark"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Opening Mark
                </label>
                <input
                  type="text"
                  id="openingMark"
                  name="openingMark"
                  value={formData.openingMark}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., A, B, C"
                />
              </div>

              <div>
                <label
                  htmlFor="openingType"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Opening Type
                </label>
                <select
                  id="openingType"
                  name="openingType"
                  value={formData.openingType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="window">Window</option>
                  <option value="door">Door</option>
                  <option value="curtain_wall">Curtain Wall</option>
                  <option value="storefront">Storefront</option>
                  <option value="ribbon_window">Ribbon Window</option>
                  <option value="clerestory">Clerestory</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="startPosition"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Start Position (feet) *
                </label>
                <input
                  type="number"
                  id="startPosition"
                  name="startPosition"
                  value={formData.startPosition}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  step="0.1"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Dimensions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Dimensions</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="width"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Width (feet) *
                </label>
                <input
                  type="number"
                  id="width"
                  name="width"
                  value={formData.width}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.width ? "border-red-500" : "border-gray-300"
                  }`}
                  step="0.1"
                  min="0.1"
                />
                {errors.width && (
                  <p className="mt-1 text-sm text-red-600">{errors.width}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="height"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Height (feet) *
                </label>
                <input
                  type="number"
                  id="height"
                  name="height"
                  value={formData.height}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.height ? "border-red-500" : "border-gray-300"
                  }`}
                  step="0.1"
                  min="0.1"
                />
                {errors.height && (
                  <p className="mt-1 text-sm text-red-600">{errors.height}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="sillHeight"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Sill Height (feet) *
                </label>
                <input
                  type="number"
                  id="sillHeight"
                  name="sillHeight"
                  value={formData.sillHeight}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.sillHeight ? "border-red-500" : "border-gray-300"
                  }`}
                  step="0.1"
                  min="0"
                />
                {errors.sillHeight && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.sillHeight}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Grid Definition */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Grid className="w-5 h-5 mr-2 text-blue-600" />
                Grid Definition
              </h3>
              <button
                type="button"
                onClick={resetGridToDefaults}
                className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Columns *
                </label>
                <input
                  type="number"
                  value={gridDefinition.columns}
                  onChange={(e) =>
                    handleGridChange("columns", parseInt(e.target.value) || 1)
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.columns ? "border-red-500" : "border-gray-300"
                  }`}
                  min="1"
                  max="20"
                />
                {errors.columns && (
                  <p className="mt-1 text-sm text-red-600">{errors.columns}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rows *
                </label>
                <input
                  type="number"
                  value={gridDefinition.rows}
                  onChange={(e) =>
                    handleGridChange("rows", parseInt(e.target.value) || 1)
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.rows ? "border-red-500" : "border-gray-300"
                  }`}
                  min="1"
                  max="20"
                />
                {errors.rows && (
                  <p className="mt-1 text-sm text-red-600">{errors.rows}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mullion Width (inches) *
                </label>
                <input
                  type="number"
                  value={gridDefinition.mullionWidth}
                  onChange={(e) =>
                    handleGridChange(
                      "mullionWidth",
                      parseFloat(e.target.value) || 2.5
                    )
                  }
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                    errors.mullionWidth ? "border-red-500" : "border-gray-300"
                  }`}
                  step="0.1"
                  min="0.1"
                  max="6"
                />
                {errors.mullionWidth && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.mullionWidth}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Typical: 2.5" for curtain wall, 2" for storefront
                </p>
              </div>
            </div>

            {/* Component Names */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">
                Component Names
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Object.entries(gridDefinition.components).map(
                  ([key, value]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">
                        {key === "jambs" ? "Jamb" : key.slice(0, -1)}
                      </label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                          handleGridChange(`component_${key}`, e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
                      />
                    </div>
                  )
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                These names will be used to map components to manufacturers'
                parts catalogs
              </p>
            </div>
          </div>

          {/* Transom Options */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Additional Options</h3>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasTransom"
                  name="hasTransom"
                  checked={formData.hasTransom}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label
                  htmlFor="hasTransom"
                  className="text-sm font-medium text-gray-700"
                >
                  Has Transom
                </label>
              </div>

              {formData.hasTransom && (
                <div className="ml-6">
                  <label
                    htmlFor="transomHeight"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Transom Height (feet)
                  </label>
                  <input
                    type="number"
                    id="transomHeight"
                    name="transomHeight"
                    value={formData.transomHeight}
                    onChange={handleInputChange}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    step="0.1"
                    min="0.1"
                  />
                </div>
              )}

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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes or specifications..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Grid Preview Panel */}
        <div className="xl:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Grid Preview</h3>
              <button
                type="button"
                onClick={() => setShowGridPreview(!showGridPreview)}
                className="text-gray-500 hover:text-gray-700"
              >
                {showGridPreview ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {showGridPreview && (
              <div className="space-y-4">
                {/* Opening Info */}
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <strong>Size:</strong> {formData.width || 0}' ×{" "}
                    {formData.height || 0}'
                  </p>
                  <p>
                    <strong>Grid:</strong> {gridDefinition.columns} ×{" "}
                    {gridDefinition.rows}
                  </p>
                  <p>
                    <strong>Mullions:</strong> {gridDefinition.mullionWidth}"
                  </p>
                </div>

                {/* Grid Visual */}
                <div className="flex justify-center">
                  <GridPreview
                    width={scaledWidth}
                    height={scaledHeight}
                    columns={gridDefinition.columns}
                    rows={gridDefinition.rows}
                    mullionWidth={gridDefinition.mullionWidth}
                    scale={scale}
                  />
                </div>

                {/* Grid Stats */}
                <div className="text-xs text-gray-500 space-y-1">
                  <p>
                    Glass panels: {gridDefinition.columns * gridDefinition.rows}
                  </p>
                  <p>Vertical mullions: {gridDefinition.columns - 1}</p>
                  <p>Horizontal mullions: {gridDefinition.rows - 1}</p>
                  <p>
                    Perimeter:{" "}
                    {(
                      2 * parseFloat(String(formData.width) || "0") +
                      2 * parseFloat(String(formData.height) || "0")
                    ).toFixed(1)}
                    '
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline"
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
            "Update Opening"
          ) : (
            "Create Opening"
          )}
        </button>
      </div>
    </div>
  );
};

// Grid Preview Component
interface GridPreviewProps {
  width: number;
  height: number;
  columns: number;
  rows: number;
  mullionWidth: number;
  scale: number;
}

const GridPreview: React.FC<GridPreviewProps> = ({
  width,
  height,
  columns,
  rows,
  mullionWidth,
  scale,
}) => {
  const mullionPixelWidth = Math.max(1, (mullionWidth * scale) / 12); // Convert inches to pixels

  return (
    <svg
      width={width + 40}
      height={height + 40}
      className="border border-gray-300 rounded bg-white"
    >
      {/* Opening outline */}
      <rect
        x={20}
        y={20}
        width={width}
        height={height}
        fill="none"
        stroke="#374151"
        strokeWidth="2"
      />

      {/* Vertical mullions */}
      {Array.from({ length: columns - 1 }, (_, i) => {
        const x = 20 + ((i + 1) * width) / columns;
        return (
          <rect
            key={`v-${i}`}
            x={x - mullionPixelWidth / 2}
            y={20}
            width={mullionPixelWidth}
            height={height}
            fill="#2563eb"
          />
        );
      })}

      {/* Horizontal mullions */}
      {Array.from({ length: rows - 1 }, (_, i) => {
        const y = 20 + ((i + 1) * height) / rows;
        return (
          <rect
            key={`h-${i}`}
            x={20}
            y={y - mullionPixelWidth / 2}
            width={width}
            height={mullionPixelWidth}
            fill="#2563eb"
          />
        );
      })}

      {/* Glass panel indicators */}
      {Array.from({ length: columns * rows }, (_, i) => {
        const col = i % columns;
        const row = Math.floor(i / columns);
        const panelWidth = width / columns;
        const panelHeight = height / rows;
        const centerX = 20 + col * panelWidth + panelWidth / 2;
        const centerY = 20 + row * panelHeight + panelHeight / 2;

        return (
          <circle
            key={`glass-${i}`}
            cx={centerX}
            cy={centerY}
            r="3"
            fill="#60a5fa"
            opacity="0.6"
          />
        );
      })}

      {/* Labels */}
      <text
        x={20 + width / 2}
        y={15}
        textAnchor="middle"
        className="text-xs fill-gray-600"
      >
        {columns} × {rows}
      </text>
    </svg>
  );
};

export default OpeningForm;
