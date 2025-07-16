// components/estimating/InteractiveGridEditor.tsx

"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Grid,
  RotateCw,
  Settings,
  Eye,
  EyeOff,
  Move,
  Edit3,
  Plus,
  Minus,
  Save,
  X,
} from "lucide-react";

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

interface InteractiveGridEditorProps {
  openingId: number;
  scale?: number;
}

const InteractiveGridEditor: React.FC<InteractiveGridEditorProps> = ({
  openingId,
  scale = 30,
}) => {
  const [gridData, setGridData] = useState<OpeningWithGrid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [editMode, setEditMode] = useState<"view" | "move" | "edit_grid">(
    "view"
  );
  const [showMullionLabels, setShowMullionLabels] = useState(true);
  const [showPanelLabels, setShowPanelLabels] = useState(true);
  const [selectedMullion, setSelectedMullion] = useState<GridMullion | null>(
    null
  );
  const [hoveredMullion, setHoveredMullion] = useState<number | null>(null);
  const [showGridEditor, setShowGridEditor] = useState(false);

  // Drag state
  const [dragData, setDragData] = useState<{
    mullionId: number;
    startPos: number;
    startX: number;
    startY: number;
  } | null>(null);

  // Grid editing state
  const [gridEditData, setGridEditData] = useState({
    columns: 2,
    rows: 2,
    mullionWidth: 2.5,
  });

  const svgRef = useRef<SVGSVGElement>(null);

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

      // Update grid edit data
      if (data.opening) {
        setGridEditData({
          columns: data.opening.gridColumns,
          rows: data.opening.gridRows,
          mullionWidth: parseFloat(data.opening.mullionWidth),
        });
      }
    } catch (err) {
      console.error("Error fetching grid data:", err);
      setError(err instanceof Error ? err.message : "Failed to load grid data");
    } finally {
      setLoading(false);
    }
  };

  const toggleMullion = async (mullionId: number, isActive: boolean) => {
    try {
      const response = await fetch(
        `/api/openings/${openingId}/grid/mullions/${mullionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "toggle", isActive }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to toggle mullion");
      }

      // Update local state
      setGridData((prev) =>
        prev
          ? {
              ...prev,
              gridMullions: prev.gridMullions?.map((m) =>
                m.id === mullionId ? { ...m, isActive } : m
              ),
            }
          : null
      );
    } catch (err) {
      console.error("Error toggling mullion:", err);
      setError("Failed to toggle mullion");
    }
  };

  const moveMullion = async (mullionId: number, newPosition: number) => {
    try {
      const response = await fetch(
        `/api/openings/${openingId}/grid/mullions/${mullionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "move", newPosition }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to move mullion");
      }

      // Update local state
      setGridData((prev) =>
        prev
          ? {
              ...prev,
              gridMullions: prev.gridMullions?.map((m) =>
                m.id === mullionId ? { ...m, customPosition: newPosition } : m
              ),
            }
          : null
      );
    } catch (err) {
      console.error("Error moving mullion:", err);
      setError("Failed to move mullion");
    }
  };

  const updateGridParameters = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/openings/${openingId}/grid`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columns: gridEditData.columns,
          rows: gridEditData.rows,
          mullionWidth: gridEditData.mullionWidth,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update grid");
      }

      await fetchGridData(); // Refresh data
      setShowGridEditor(false);
    } catch (err) {
      console.error("Error updating grid:", err);
      setError("Failed to update grid parameters");
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

      await fetchGridData();
    } catch (err) {
      console.error("Error regenerating grid:", err);
      setError("Failed to regenerate grid");
    } finally {
      setLoading(false);
    }
  };

  // Handle mullion click
  const handleMullionClick = (
    mullion: GridMullion,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    if (editMode === "view") {
      setSelectedMullion(mullion);
    } else if (
      editMode === "move" &&
      (mullion.gridType === "vertical" || mullion.gridType === "horizontal")
    ) {
      // Start dragging
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        setDragData({
          mullionId: mullion.id,
          startPos: mullion.customPosition || 0,
          startX: event.clientX,
          startY: event.clientY,
        });
      }
    }
  };

  // Handle mouse move for dragging
  const handleMouseMove = (event: React.MouseEvent) => {
    if (dragData && editMode === "move" && gridData) {
      const mullion = gridData.gridMullions?.find(
        (m) => m.id === dragData.mullionId
      );
      if (mullion) {
        const deltaX = event.clientX - dragData.startX;
        const deltaY = event.clientY - dragData.startY;

        let newPosition = dragData.startPos;

        if (mullion.gridType === "vertical") {
          newPosition += deltaX / scale;
        } else if (mullion.gridType === "horizontal") {
          newPosition += deltaY / scale;
        }

        // Constrain to opening bounds
        const maxPos =
          mullion.gridType === "vertical"
            ? parseFloat(gridData.width)
            : parseFloat(gridData.height);

        newPosition = Math.max(0, Math.min(maxPos, newPosition));

        // Update local state immediately for smooth dragging
        setGridData((prev) =>
          prev
            ? {
                ...prev,
                gridMullions: prev.gridMullions?.map((m) =>
                  m.id === dragData.mullionId
                    ? { ...m, customPosition: newPosition }
                    : m
                ),
              }
            : null
        );
      }
    }
  };

  // Handle mouse up (end dragging)
  const handleMouseUp = async () => {
    if (dragData && gridData) {
      const mullion = gridData.gridMullions?.find(
        (m) => m.id === dragData.mullionId
      );
      if (mullion && mullion.customPosition !== null) {
        await moveMullion(dragData.mullionId, mullion.customPosition);
      }
    }
    setDragData(null);
  };

  useEffect(() => {
    if (openingId) {
      fetchGridData();
    }
  }, [openingId]);

  if (loading && !gridData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <RotateCw className="w-5 h-5 animate-spin mr-2" />
          Loading interactive grid...
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
  const canvasWidth = scaledWidth + 100;
  const canvasHeight = scaledHeight + 100;
  const offsetX = 50;
  const offsetY = 50;

  // Get active elements
  const activeMullions = gridData.gridMullions?.filter((m) => m.isActive) || [];
  const activeGlassPanels =
    gridData.gridGlassPanels?.filter((p) => p.isActive) || [];

  // Render mullion with interaction
  const renderMullion = (mullion: GridMullion, index: number) => {
    const isSelected = selectedMullion?.id === mullion.id;
    const isHovered = hoveredMullion === mullion.id;
    const mullionWidthPixels = Math.max(
      2,
      (parseFloat(gridData.mullionWidth) * scale) / 12
    );

    let x1, y1, x2, y2;

    if (mullion.gridType === "vertical") {
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

    const strokeColor = isSelected
      ? "#dc2626"
      : isHovered
      ? "#2563eb"
      : "#374151";
    const strokeWidth = isSelected ? 4 : isHovered ? 3 : mullionWidthPixels;
    const isMoveable =
      mullion.gridType === "vertical" || mullion.gridType === "horizontal";

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
          className={`transition-colors ${
            editMode === "move" && isMoveable ? "cursor-move" : "cursor-pointer"
          }`}
          onClick={(e) => handleMullionClick(mullion, e)}
          onMouseEnter={() => setHoveredMullion(mullion.id)}
          onMouseLeave={() => setHoveredMullion(null)}
        />

        {/* Control handles for moveable mullions */}
        {isMoveable && (editMode === "move" || isSelected) && (
          <circle
            cx={mullion.gridType === "vertical" ? x1 : (x1 + x2) / 2}
            cy={mullion.gridType === "vertical" ? (y1 + y2) / 2 : y1}
            r="6"
            fill={isSelected ? "#dc2626" : isHovered ? "#2563eb" : "#6b7280"}
            className="cursor-move opacity-75 hover:opacity-100"
            onClick={(e) => handleMullionClick(mullion, e)}
          />
        )}

        {/* Toggle button */}
        <g transform={`translate(${x1 - 15}, ${y1 - 15})`}>
          <circle
            r="8"
            fill={mullion.isActive ? "#10b981" : "#ef4444"}
            className="cursor-pointer opacity-75 hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              toggleMullion(mullion.id, !mullion.isActive);
            }}
          />
          <text
            textAnchor="middle"
            dy="3"
            fontSize="10"
            fill="white"
            className="pointer-events-none"
          >
            {mullion.isActive ? "✓" : "✗"}
          </text>
        </g>

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

        <circle
          cx={x + width / 2}
          cy={y + height / 2}
          r="3"
          fill="rgba(59, 130, 246, 0.8)"
        />

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
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Grid className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium">Interactive Grid Editor</span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Mode:</span>
            <select
              value={editMode}
              onChange={(e) => setEditMode(e.target.value as any)}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="view">View</option>
              <option value="move">Move Mullions</option>
            </select>
          </div>
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
            onClick={() => setShowGridEditor(true)}
            className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
          >
            <Settings className="w-4 h-4 mr-1" />
            Edit Grid
          </button>

          <button
            onClick={regenerateGrid}
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

      {/* Instructions */}
      {editMode === "move" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center text-blue-800">
            <Move className="w-4 h-4 mr-2" />
            <span className="text-sm">
              <strong>Move Mode:</strong> Click and drag vertical/horizontal
              mullions to reposition them. Click the toggle buttons to
              enable/disable mullions.
            </span>
          </div>
        </div>
      )}

      {/* Main Grid Display */}
      <div className="bg-gray-50 rounded-lg border overflow-auto">
        <svg
          ref={svgRef}
          width={canvasWidth}
          height={canvasHeight}
          className="border border-gray-300"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-blue-900">Selected Mullion</h4>
            <button
              onClick={() => setSelectedMullion(null)}
              className="text-blue-400 hover:text-blue-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
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
            <div>
              <span className="text-blue-700 font-medium">Position:</span>
              <p>{selectedMullion.customPosition?.toFixed(2) || "Default"}"</p>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Status:</span>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  selectedMullion.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {selectedMullion.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Grid Editor Modal */}
      {showGridEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Edit Grid Parameters</h3>
              <button
                onClick={() => setShowGridEditor(false)}
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
                        setGridEditData((prev) => ({
                          ...prev,
                          columns: Math.max(1, prev.columns - 1),
                        }))
                      }
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={gridEditData.columns}
                      onChange={(e) =>
                        setGridEditData((prev) => ({
                          ...prev,
                          columns: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="20"
                    />
                    <button
                      onClick={() =>
                        setGridEditData((prev) => ({
                          ...prev,
                          columns: Math.min(20, prev.columns + 1),
                        }))
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
                        setGridEditData((prev) => ({
                          ...prev,
                          rows: Math.max(1, prev.rows - 1),
                        }))
                      }
                      className="p-1 text-gray-600 hover:text-gray-800"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={gridEditData.rows}
                      onChange={(e) =>
                        setGridEditData((prev) => ({
                          ...prev,
                          rows: parseInt(e.target.value) || 1,
                        }))
                      }
                      className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      min="1"
                      max="20"
                    />
                    <button
                      onClick={() =>
                        setGridEditData((prev) => ({
                          ...prev,
                          rows: Math.min(20, prev.rows + 1),
                        }))
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
                  value={gridEditData.mullionWidth}
                  onChange={(e) =>
                    setGridEditData((prev) => ({
                      ...prev,
                      mullionWidth: parseFloat(e.target.value) || 2.5,
                    }))
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
                  <p>
                    Glass panels: {gridEditData.columns * gridEditData.rows}
                  </p>
                  <p>Vertical mullions: {gridEditData.columns - 1}</p>
                  <p>Horizontal mullions: {gridEditData.rows - 1}</p>
                  <p>
                    Panel size: ~
                    {(openingWidth / gridEditData.columns).toFixed(1)}' ×{" "}
                    {(openingHeight / gridEditData.rows).toFixed(1)}'
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setGridEditData({
                    columns: gridData?.gridColumns || 2,
                    rows: gridData?.gridRows || 2,
                    mullionWidth: parseFloat(gridData?.mullionWidth || "2.5"),
                  });
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={() => setShowGridEditor(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateGridParameters}
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
      )}

      {/* Stats Panel */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Grid Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Glass Panels:</span>
            <p className="font-medium">{activeGlassPanels.length}</p>
          </div>
          <div>
            <span className="text-gray-600">Total Mullions:</span>
            <p className="font-medium">{activeMullions.length}</p>
          </div>
          <div>
            <span className="text-gray-600">Active Mullions:</span>
            <p className="font-medium">
              {activeMullions.filter((m) => m.isActive).length}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Opening Area:</span>
            <p className="font-medium">
              {(openingWidth * openingHeight).toFixed(1)} sq ft
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveGridEditor;
