// components/estimating/VisualGridViewer.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Grid, RotateCw, Settings, Eye, EyeOff } from "lucide-react";

interface GridMullion {
  id: number;
  gridType: string;
  gridColumn?: number | null;
  gridRow?: number | null;
  componentName: string;
  length: string;
  customPosition: number | null;
  isActive: boolean;
}

interface GridGlassPanel {
  id: number;
  gridColumn: number;
  gridRow: number;
  x: string;
  y: string;
  width: string;
  height: string;
  isTransom: boolean;
  isActive: boolean;
}

interface OpeningWithGrid {
  id: number;
  name: string;
  width: string;
  height: string;
  gridColumns: number;
  gridRows: number;
  mullionWidth: string;
  gridMullions?: GridMullion[];
  gridGlassPanels?: GridGlassPanel[];
}

interface VisualGridViewerProps {
  openingId: number;
  scale?: number;
}

const VisualGridViewer: React.FC<VisualGridViewerProps> = ({
  openingId,
  scale = 30,
}) => {
  const [gridData, setGridData] = useState<OpeningWithGrid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMullionLabels, setShowMullionLabels] = useState(true);
  const [showPanelLabels, setShowPanelLabels] = useState(true);
  const [selectedMullion, setSelectedMullion] = useState<GridMullion | null>(
    null
  );

  const fetchGridData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/openings/${openingId}/grid`);

      if (!response.ok) {
        throw new Error("Failed to fetch grid data");
      }

      const data = await response.json();
      setGridData(data.opening);
    } catch (err) {
      console.error("Error fetching grid data:", err);
      setError(err instanceof Error ? err.message : "Failed to load grid data");
    } finally {
      setLoading(false);
    }
  };

  const regenerateGrid = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/openings/${openingId}/grid`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to regenerate grid");
      }

      await fetchGridData(); // Refresh the data
    } catch (err) {
      console.error("Error regenerating grid:", err);
      setError(
        err instanceof Error ? err.message : "Failed to regenerate grid"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (openingId) {
      fetchGridData();
    }
  }, [openingId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <RotateCw className="w-5 h-5 animate-spin mr-2" />
          Loading grid...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-600 text-sm mb-2">Error: {error}</div>
        <button
          onClick={fetchGridData}
          className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!gridData) {
    return null;
  }

  // Calculate dimensions
  const openingWidth = parseFloat(gridData.width);
  const openingHeight = parseFloat(gridData.height);
  const scaledWidth = openingWidth * scale;
  const scaledHeight = openingHeight * scale;
  const canvasWidth = scaledWidth + 100; // Extra space for labels
  const canvasHeight = scaledHeight + 100;
  const offsetX = 50;
  const offsetY = 50;

  // Get active elements
  const activeMullions = gridData.gridMullions?.filter((m) => m.isActive) || [];
  const activeGlassPanels =
    gridData.gridGlassPanels?.filter((p) => p.isActive) || [];

  // Render mullion
  const renderMullion = (mullion: GridMullion, index: number) => {
    const isSelected = selectedMullion?.id === mullion.id;
    const mullionWidthPixels = Math.max(
      2,
      (parseFloat(gridData.mullionWidth) * scale) / 12
    );

    let x1, y1, x2, y2;

    if (mullion.gridType === "vertical") {
      // Use custom position if available, otherwise calculate from grid
      const position =
        mullion.customPosition !== null
          ? mullion.customPosition
          : (mullion.gridColumn || 0) * (openingWidth / gridData.gridColumns);

      const xPos = offsetX + position * scale;
      x1 = x2 = xPos;
      y1 = offsetY;
      y2 = offsetY + scaledHeight;
    } else if (mullion.gridType === "horizontal") {
      const position =
        mullion.customPosition !== null
          ? mullion.customPosition
          : (mullion.gridRow || 0) * (openingHeight / gridData.gridRows);

      const yPos = offsetY + scaledHeight - position * scale;
      x1 = offsetX;
      x2 = offsetX + scaledWidth;
      y1 = y2 = yPos;
    } else {
      // Perimeter mullions
      switch (mullion.gridType) {
        case "sill":
          x1 = offsetX;
          x2 = offsetX + scaledWidth;
          y1 = y2 = offsetY + scaledHeight;
          break;
        case "head":
          x1 = offsetX;
          x2 = offsetX + scaledWidth;
          y1 = y2 = offsetY;
          break;
        case "jamb_left":
          x1 = x2 = offsetX;
          y1 = offsetY;
          y2 = offsetY + scaledHeight;
          break;
        case "jamb_right":
          x1 = x2 = offsetX + scaledWidth;
          y1 = offsetY;
          y2 = offsetY + scaledHeight;
          break;
        default:
          return null;
      }
    }

    const strokeColor = isSelected ? "#dc2626" : "#374151";
    const strokeWidth = isSelected ? 4 : mullionWidthPixels;

    return (
      <g key={`mullion-${mullion.id}-${index}`}>
        {/* Mullion line */}
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          className="cursor-pointer transition-colors hover:stroke-blue-500"
          onClick={() => setSelectedMullion(mullion)}
        />

        {/* Label */}
        {showMullionLabels && (
          <text
            x={(x1 + x2) / 2}
            y={(y1 + y2) / 2 - 5}
            textAnchor="middle"
            fontSize="8"
            fill="#374151"
            className="pointer-events-none select-none"
          >
            {mullion.componentName.substring(0, 4)}
          </text>
        )}
      </g>
    );
  };

  // Render glass panel
  const renderGlassPanel = (panel: GridGlassPanel, index: number) => {
    const x = offsetX + parseFloat(panel.x) * scale;
    const y =
      offsetY +
      scaledHeight -
      parseFloat(panel.y) * scale -
      parseFloat(panel.height) * scale;
    const width = parseFloat(panel.width) * scale;
    const height = parseFloat(panel.height) * scale;

    return (
      <g key={`glass-${panel.id}-${index}`}>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          fill={
            panel.isTransom
              ? "rgba(147, 197, 253, 0.3)"
              : "rgba(219, 234, 254, 0.4)"
          }
          stroke="rgba(59, 130, 246, 0.5)"
          strokeWidth="1"
          className="cursor-pointer hover:fill-blue-200"
        />

        {/* Glass panel indicator */}
        <circle
          cx={x + width / 2}
          cy={y + height / 2}
          r="3"
          fill="rgba(59, 130, 246, 0.8)"
        />

        {/* Panel label */}
        {showPanelLabels && (
          <text
            x={x + width / 2}
            y={y + height / 2 + 15}
            textAnchor="middle"
            fontSize="8"
            fill="#374151"
            className="pointer-events-none select-none"
          >
            {panel.isTransom ? "T" : ""}
            {panel.gridRow + 1}-{panel.gridColumn + 1}
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Grid className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">Visual Grid Editor</h3>
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
            Mullions
          </button>

          <button
            onClick={() => setShowPanelLabels(!showPanelLabels)}
            className={`flex items-center px-2 py-1 text-xs rounded ${
              showPanelLabels
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {showPanelLabels ? (
              <Eye className="w-3 h-3 mr-1" />
            ) : (
              <EyeOff className="w-3 h-3 mr-1" />
            )}
            Panels
          </button>

          <button
            onClick={regenerateGrid}
            disabled={loading}
            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded disabled:opacity-50"
          >
            <RotateCw
              className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
            />
            Regenerate
          </button>
        </div>
      </div>

      {/* Grid Info */}
      <div className="bg-gray-50 rounded p-3">
        <div className="flex items-center justify-between text-sm">
          <span>
            <strong>{gridData.name}</strong> - {gridData.width}' ×{" "}
            {gridData.height}'
          </span>
          <span>
            Grid: {gridData.gridColumns} × {gridData.gridRows} | Mullions:{" "}
            {gridData.mullionWidth}"
          </span>
        </div>
      </div>

      {/* SVG Grid */}
      <div className="overflow-auto bg-gray-50 rounded-lg border">
        <svg
          width={canvasWidth}
          height={canvasHeight}
          className="border border-gray-300"
        >
          {/* Opening outline */}
          <rect
            x={offsetX}
            y={offsetY}
            width={scaledWidth}
            height={scaledHeight}
            fill="white"
            stroke="#374151"
            strokeWidth="2"
          />

          {/* Grid reference lines */}
          {Array.from({ length: gridData.gridColumns - 1 }, (_, i) => {
            const x = offsetX + ((i + 1) * scaledWidth) / gridData.gridColumns;
            return (
              <line
                key={`grid-v-${i}`}
                x1={x}
                y1={offsetY}
                x2={x}
                y2={offsetY + scaledHeight}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.5"
              />
            );
          })}

          {Array.from({ length: gridData.gridRows - 1 }, (_, i) => {
            const y = offsetY + ((i + 1) * scaledHeight) / gridData.gridRows;
            return (
              <line
                key={`grid-h-${i}`}
                x1={offsetX}
                y1={y}
                x2={offsetX + scaledWidth}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
                opacity="0.5"
              />
            );
          })}

          {/* Glass panels */}
          {activeGlassPanels.map((panel, index) =>
            renderGlassPanel(panel, index)
          )}

          {/* Mullions */}
          {activeMullions.map((mullion, index) =>
            renderMullion(mullion, index)
          )}

          {/* Dimensions */}
          <text
            x={offsetX + scaledWidth / 2}
            y={offsetY - 10}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
          >
            {gridData.width}'
          </text>

          <text
            x={offsetX - 15}
            y={offsetY + scaledHeight / 2}
            textAnchor="middle"
            fontSize="12"
            fill="#374151"
            transform={`rotate(-90, ${offsetX - 15}, ${
              offsetY + scaledHeight / 2
            })`}
          >
            {gridData.height}'
          </text>
        </svg>
      </div>

      {/* Selected Mullion Info */}
      {selectedMullion && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">Selected Mullion</h4>
            <button
              onClick={() => setSelectedMullion(null)}
              className="text-blue-400 hover:text-blue-600"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Type:</span>
              <p className="capitalize">
                {selectedMullion.gridType.replace("_", " ")}
              </p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Component:</span>
              <p>{selectedMullion.componentName}</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Length:</span>
              <p>{parseFloat(selectedMullion.length).toFixed(2)}'</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualGridViewer;
