// components/estimating/grid/GridParametersDialog.tsx
"use client";

import React from "react";
import { Save, X, Plus, Minus, RotateCw } from "lucide-react";

interface GridEditData {
  columns: number;
  rows: number;
  mullionWidth: number;
}

interface GridParametersDialogProps {
  show: boolean;
  editData: GridEditData;
  onEditDataChange: (data: Partial<GridEditData>) => void;
  onSave: () => void;
  onReset: () => void;
  onClose: () => void;
  loading: boolean;
  openingWidth: number;
  openingHeight: number;
}

export const GridParametersDialog: React.FC<GridParametersDialogProps> = ({
  show,
  editData,
  onEditDataChange,
  onSave,
  onReset,
  onClose,
  loading,
  openingWidth,
  openingHeight,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold">Grid Parameters</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Columns
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    onEditDataChange({
                      columns: Math.max(1, editData.columns - 1),
                    })
                  }
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={editData.columns}
                  onChange={(e) =>
                    onEditDataChange({
                      columns: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="20"
                />
                <button
                  onClick={() =>
                    onEditDataChange({
                      columns: Math.min(20, editData.columns + 1),
                    })
                  }
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rows
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    onEditDataChange({
                      rows: Math.max(1, editData.rows - 1),
                    })
                  }
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={editData.rows}
                  onChange={(e) =>
                    onEditDataChange({
                      rows: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="20"
                />
                <button
                  onClick={() =>
                    onEditDataChange({
                      rows: Math.min(20, editData.rows + 1),
                    })
                  }
                  className="p-1 text-gray-600 hover:text-gray-800"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mullion Width (inches)
            </label>
            <input
              type="number"
              value={editData.mullionWidth}
              onChange={(e) =>
                onEditDataChange({
                  mullionWidth: parseFloat(e.target.value) || 2.5,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              step="0.1"
              min="0.5"
              max="6"
            />
          </div>

          {/* Preview */}
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600 mb-2">Preview:</p>
            <div className="text-xs text-gray-700 space-y-1">
              <p>Glass panels: {editData.columns * editData.rows}</p>
              <p>Vertical mullions: {editData.columns + 1} (including jambs)</p>
              <p>
                Horizontal mullions: {editData.rows - 1 + 2} (including
                head/sill)
              </p>
              <p>
                Panel size: ~{(openingWidth / editData.columns).toFixed(1)}' ×{" "}
                {(openingHeight / editData.rows).toFixed(1)}'
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onReset}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Reset
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RotateCw className="w-4 h-4 mr-2 animate-spin inline" />
                Updating...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2 inline" />
                Apply Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
