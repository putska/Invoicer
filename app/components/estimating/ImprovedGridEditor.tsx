// components/estimating/ImprovedGridEditor.tsx (Updated for Segmented Mullions)

"use client";

import React, { useState, useEffect } from "react";
import { RotateCw, Info } from "lucide-react";
import { GridToolbar } from "./grid/GridToolbar";
import { GridVisualization } from "./grid/GridVisualization";
import { MullionEditDialog } from "./grid/MullionEditDialog";
import { GridParametersDialog } from "./grid/GridParametersDialog";
import { GridStatistics } from "./grid/GridStatistics";

// Updated interface to match your new schema
interface GridMullion {
  id: number;
  gridType: string;
  gridColumn?: number | null;
  gridRow?: number | null;
  gridSegment?: number | null; // NEW - for horizontal segments
  componentName: string;
  length: string;
  customPosition: number | null;
  startX?: number | null; // NEW - segment start position
  endX?: number | null; // NEW - segment end position
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

interface ImprovedGridEditorProps {
  openingId: number;
  scale?: number;
}

const ImprovedGridEditor: React.FC<ImprovedGridEditorProps> = ({
  openingId,
  scale = 30,
}) => {
  const [gridData, setGridData] = useState<OpeningWithGrid | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [showMullionLabels, setShowMullionLabels] = useState(true);
  const [showPanelLabels, setShowPanelLabels] = useState(true);
  const [showInactiveMullions, setShowInactiveMullions] = useState(true);
  const [selectedMullion, setSelectedMullion] = useState<GridMullion | null>(
    null
  );
  const [hoveredMullion, setHoveredMullion] = useState<number | null>(null);
  const [showGridEditor, setShowGridEditor] = useState(false);
  const [showMullionDialog, setShowMullionDialog] = useState(false);

  // Grid editing state
  const [gridEditData, setGridEditData] = useState({
    columns: 2,
    rows: 2,
    mullionWidth: 2.5,
  });

  // Mullion editing state - updated to handle new fields
  const [mullionEditData, setMullionEditData] = useState({
    isActive: true,
    componentName: "",
    customPosition: null as number | null,
    startX: null as number | null,
    endX: null as number | null,
  });

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

  const updateMullion = async (mullionId: number, updates: any) => {
    try {
      // Add debugging
      console.log("Sending mullion update:", updates);

      const response = await fetch(
        `/api/openings/${openingId}/grid/mullions/${mullionId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.log("API Error Response:", errorData);
        throw new Error("Failed to update mullion");
      }

      const result = await response.json();

      // Update local state
      setGridData((prev) =>
        prev
          ? {
              ...prev,
              gridMullions: prev.gridMullions?.map((m) =>
                m.id === mullionId ? { ...m, ...updates } : m
              ),
            }
          : null
      );

      return result.mullion;
    } catch (err) {
      console.error("Error updating mullion:", err);
      setError("Failed to update mullion");
      throw err;
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

      await fetchGridData();
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

  const handleMullionClick = (
    mullion: GridMullion,
    event: React.MouseEvent
  ) => {
    event.stopPropagation();

    // Updated to handle new segmentation fields
    setMullionEditData({
      isActive: mullion.isActive,
      componentName: mullion.componentName,
      customPosition: mullion.customPosition,
      startX: mullion.startX ?? null,
      endX: mullion.endX ?? null,
    });
    setSelectedMullion(mullion);
    setShowMullionDialog(true);
  };

  const handleMullionUpdate = async () => {
    if (!selectedMullion) return;

    try {
      await updateMullion(selectedMullion.id, {
        isActive: mullionEditData.isActive,
        componentName: mullionEditData.componentName,
        customPosition: mullionEditData.customPosition,
        startX: mullionEditData.startX,
        endX: mullionEditData.endX,
      });

      setShowMullionDialog(false);
      setSelectedMullion(null);
    } catch (err) {
      // Error already handled in updateMullion
    }
  };

  const handleGridEditDataChange = (updates: Partial<typeof gridEditData>) => {
    setGridEditData((prev) => ({ ...prev, ...updates }));
  };

  const handleMullionEditDataChange = (
    updates: Partial<typeof mullionEditData>
  ) => {
    setMullionEditData((prev) => ({ ...prev, ...updates }));
  };

  const handleResetGridData = () => {
    if (gridData) {
      setGridEditData({
        columns: gridData.gridColumns,
        rows: gridData.gridRows,
        mullionWidth: parseFloat(gridData.mullionWidth),
      });
    }
  };

  // Helper function to get a display name for segmented mullions
  const getMullionDisplayName = (mullion: GridMullion): string => {
    const baseName = mullion.componentName;
    if (mullion.gridSegment !== null && mullion.gridSegment !== undefined) {
      return `${baseName} Seg-${mullion.gridSegment + 1}`;
    }
    return baseName;
  };

  // Helper function to count mullions by type
  const getMullionCounts = () => {
    const allMullions = gridData?.gridMullions || [];
    const activeMullions = allMullions.filter((m) => m.isActive);

    const counts = {
      total: allMullions.length,
      active: activeMullions.length,
      vertical: activeMullions.filter((m) => m.gridType === "vertical").length,
      horizontal: activeMullions.filter((m) => m.gridType === "horizontal")
        .length,
      sill: activeMullions.filter((m) => m.gridType === "sill").length,
      head: activeMullions.filter((m) => m.gridType === "head").length,
      jambs: activeMullions.filter((m) => m.gridType.includes("jamb")).length,
    };

    return counts;
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
          Loading grid editor...
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

  if (!gridData) return null;

  // Calculate data for child components
  const openingWidth = parseFloat(gridData.width);
  const openingHeight = parseFloat(gridData.height);
  const allMullions = gridData.gridMullions || [];
  const visibleMullions = showInactiveMullions
    ? allMullions
    : allMullions.filter((m) => m.isActive);
  const activeGlassPanels =
    gridData.gridGlassPanels?.filter((p) => p.isActive) || [];

  const mullionCounts = getMullionCounts();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header with mullion counts */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Grid Editor - {gridData.name}
        </h3>
        <div className="text-sm text-gray-600">
          {mullionCounts.active} active mullions ({mullionCounts.vertical}V,{" "}
          {mullionCounts.horizontal}H, {mullionCounts.sill}S,{" "}
          {mullionCounts.head}H, {mullionCounts.jambs}J)
        </div>
      </div>

      {/* Toolbar */}
      <GridToolbar
        showMullionLabels={showMullionLabels}
        setShowMullionLabels={setShowMullionLabels}
        showInactiveMullions={showInactiveMullions}
        setShowInactiveMullions={setShowInactiveMullions}
        onOpenGridEditor={() => setShowGridEditor(true)}
        onRegenerate={regenerateGrid}
        loading={loading}
      />

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start text-blue-800">
          <Info className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p>
              <strong>Click on any mullion segment</strong> to edit its
              properties, toggle on/off, rename, or adjust position.
            </p>
            <p className="mt-1 text-blue-600">
              Verticals run through (structural), horizontals are segmented
              between verticals. Each segment can be individually controlled.
            </p>
          </div>
        </div>
      </div>

      {/* Selected mullion info */}
      {selectedMullion && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="text-sm text-yellow-800">
            <strong>Selected:</strong> {getMullionDisplayName(selectedMullion)}
            {selectedMullion.gridType === "horizontal" &&
              selectedMullion.startX !== null &&
              selectedMullion.endX !== null &&
              selectedMullion.startX !== undefined &&
              selectedMullion.endX !== undefined && (
                <span className="ml-2">
                  (From{" "}
                  {parseFloat(selectedMullion.startX.toString()).toFixed(2)}' to{" "}
                  {parseFloat(selectedMullion.endX.toString()).toFixed(2)}')
                </span>
              )}
          </div>
        </div>
      )}

      {/* Main Grid Visualization */}
      <GridVisualization
        gridData={gridData}
        visibleMullions={visibleMullions}
        activeGlassPanels={activeGlassPanels}
        selectedMullion={selectedMullion}
        hoveredMullion={hoveredMullion}
        showMullionLabels={showMullionLabels}
        showPanelLabels={showPanelLabels}
        scale={scale}
        onMullionClick={handleMullionClick}
        onMullionHover={setHoveredMullion}
      />

      {/* Mullion Edit Dialog */}
      <MullionEditDialog
        show={showMullionDialog}
        mullion={selectedMullion}
        editData={mullionEditData}
        onEditDataChange={handleMullionEditDataChange}
        onSave={handleMullionUpdate}
        onClose={() => {
          setShowMullionDialog(false);
          setSelectedMullion(null);
        }}
      />

      {/* Grid Parameters Dialog */}
      <GridParametersDialog
        show={showGridEditor}
        editData={gridEditData}
        onEditDataChange={handleGridEditDataChange}
        onSave={updateGridParameters}
        onReset={handleResetGridData}
        onClose={() => setShowGridEditor(false)}
        loading={loading}
        openingWidth={openingWidth}
        openingHeight={openingHeight}
      />

      {/* Statistics */}
      <GridStatistics
        allMullions={allMullions}
        activeGlassPanels={activeGlassPanels}
        openingWidth={openingWidth}
        openingHeight={openingHeight}
      />
    </div>
  );
};

export default ImprovedGridEditor;
