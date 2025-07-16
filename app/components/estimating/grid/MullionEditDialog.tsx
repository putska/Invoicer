// components/estimating/grid/MullionEditDialog.tsx - Updated for segmented mullions
"use client";

import React from "react";
import { Save, X } from "lucide-react";

interface GridMullion {
  id: number;
  gridType: string;
  gridColumn?: number | null;
  gridRow?: number | null;
  gridSegment?: number | null; // NEW
  componentName: string;
  length: string;
  customPosition: number | null;
  startX?: number | null; // NEW
  endX?: number | null; // NEW
  isActive: boolean;
}

interface MullionEditData {
  isActive: boolean;
  componentName: string;
  customPosition: number | null;
  startX: number | null; // NEW
  endX: number | null; // NEW
}

interface MullionEditDialogProps {
  show: boolean;
  mullion: GridMullion | null;
  editData: MullionEditData;
  onEditDataChange: (data: Partial<MullionEditData>) => void;
  onSave: () => void;
  onClose: () => void;
}

export const MullionEditDialog: React.FC<MullionEditDialogProps> = ({
  show,
  mullion,
  editData,
  onEditDataChange,
  onSave,
  onClose,
}) => {
  if (!show || !mullion) return null;

  // Check if this is a horizontal segment (has startX and endX)
  const isHorizontalSegment =
    mullion.gridType === "horizontal" ||
    (["sill", "head"].includes(mullion.gridType) &&
      mullion.gridSegment !== null);

  // Helper function to get display name for the mullion
  const getMullionDisplayName = () => {
    const baseName = mullion.gridType.replace("_", " ");
    if (mullion.gridSegment !== null && mullion.gridSegment !== undefined) {
      return `${baseName} (Segment ${mullion.gridSegment + 1})`;
    }
    return baseName;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Edit Mullion</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Mullion Info */}
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">
              <strong>Type:</strong> {getMullionDisplayName()}
            </p>
            <p className="text-sm text-gray-600">
              <strong>Length:</strong> {parseFloat(mullion.length).toFixed(2)}'
            </p>
            {isHorizontalSegment &&
              mullion.startX !== null &&
              mullion.endX !== null && (
                <p className="text-sm text-gray-600">
                  <strong>Position:</strong> {Number(mullion.startX).toFixed(2)}
                  ' to {Number(mullion.endX).toFixed(2)}'
                </p>
              )}
            {mullion.gridColumn !== null &&
              mullion.gridColumn !== undefined && (
                <p className="text-sm text-gray-600">
                  <strong>Column:</strong> {mullion.gridColumn + 1}
                </p>
              )}
            {mullion.gridRow !== null && mullion.gridRow !== undefined && (
              <p className="text-sm text-gray-600">
                <strong>Row:</strong> {mullion.gridRow + 1}
              </p>
            )}
          </div>

          {/* Active Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="mullionActive"
              checked={editData.isActive}
              onChange={(e) => onEditDataChange({ isActive: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="mullionActive" className="text-sm font-medium">
              Active (visible in drawings)
            </label>
          </div>

          {/* Component Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Component Name
            </label>
            <input
              type="text"
              value={editData.componentName}
              onChange={(e) =>
                onEditDataChange({ componentName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Vertical Mullion, Head, Sill"
            />
          </div>

          {/* Custom Position for Vertical and Horizontal mullions */}
          {(mullion.gridType === "vertical" ||
            mullion.gridType === "horizontal") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {mullion.gridType === "vertical"
                  ? "Distance from Left Edge (feet)"
                  : "Height from Bottom (feet)"}
              </label>
              <input
                type="number"
                step="0.1"
                value={editData.customPosition || ""}
                onChange={(e) =>
                  onEditDataChange({
                    customPosition: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for grid position"
              />
              <p className="mt-1 text-xs text-gray-500">
                Leave empty to use default grid position
              </p>
            </div>
          )}

          {/* Segment Position Controls for Horizontal Segments */}
          {isHorizontalSegment && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  Segment Position Controls
                </p>
                <p className="text-xs text-blue-600">
                  Adjust the start and end positions for this horizontal segment
                </p>
              </div>

              {/* Start X Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Position (feet from left)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editData.startX || ""}
                  onChange={(e) =>
                    onEditDataChange({
                      startX: e.target.value
                        ? parseFloat(e.target.value)
                        : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="Start position"
                />
              </div>

              {/* End X Position */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Position (feet from left)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editData.endX || ""}
                  onChange={(e) =>
                    onEditDataChange({
                      endX: e.target.value ? parseFloat(e.target.value) : null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="End position"
                />
              </div>

              {/* Calculated Length Display */}
              {editData.startX !== null && editData.endX !== null && (
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-sm text-gray-600">
                    <strong>Calculated Length:</strong>{" "}
                    {Math.abs(editData.endX - editData.startX).toFixed(2)}'
                  </p>
                </div>
              )}

              <div className="text-xs text-gray-500">
                <p>• Leave empty to use default segment positions</p>
                <p>• Length will be automatically calculated from positions</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2 inline" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
