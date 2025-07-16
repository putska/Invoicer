// components/estimating/grid/GridToolbar.tsx
"use client";

import React from "react";
import { Grid, RotateCw, Settings, Eye, EyeOff } from "lucide-react";

interface GridToolbarProps {
  showMullionLabels: boolean;
  setShowMullionLabels: (show: boolean) => void;
  showInactiveMullions: boolean;
  setShowInactiveMullions: (show: boolean) => void;
  onOpenGridEditor: () => void;
  onRegenerate: () => void;
  loading: boolean;
}

export const GridToolbar: React.FC<GridToolbarProps> = ({
  showMullionLabels,
  setShowMullionLabels,
  showInactiveMullions,
  setShowInactiveMullions,
  onOpenGridEditor,
  onRegenerate,
  loading,
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center">
        <Grid className="w-5 h-5 text-blue-600 mr-2" />
        <span className="font-medium">Professional Grid Editor</span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setShowMullionLabels(!showMullionLabels)}
          className={`flex items-center px-2 py-1 text-xs rounded ${
            showMullionLabels
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {showMullionLabels ? (
            <Eye className="w-3 h-3 mr-1" />
          ) : (
            <EyeOff className="w-3 h-3 mr-1" />
          )}
          Labels
        </button>

        <button
          onClick={() => setShowInactiveMullions(!showInactiveMullions)}
          className={`flex items-center px-2 py-1 text-xs rounded ${
            showInactiveMullions
              ? "bg-gray-100 text-gray-700"
              : "bg-gray-100 text-gray-400"
          }`}
        >
          {showInactiveMullions ? (
            <Eye className="w-3 h-3 mr-1" />
          ) : (
            <EyeOff className="w-3 h-3 mr-1" />
          )}
          Inactive
        </button>

        <button
          onClick={onOpenGridEditor}
          className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
        >
          <Settings className="w-4 h-4 mr-1" />
          Grid Settings
        </button>

        <button
          onClick={onRegenerate}
          disabled={loading}
          className="flex items-center px-3 py-1 text-sm text-green-600 hover:text-green-800 hover:bg-green-50 rounded disabled:opacity-50"
        >
          <RotateCw
            className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          Regenerate
        </button>
      </div>
    </div>
  );
};
