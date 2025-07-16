// components/estimating/SimpleGridViewer.tsx

"use client";

import React, { useState, useEffect } from "react";
import { Grid, RefreshCw } from "lucide-react";

interface GridMullion {
  id: number;
  gridType: string;
  componentName: string;
  length: string;
  isActive: boolean;
  customPosition: number | null;
}

interface GridGlassPanel {
  id: number;
  gridColumn: number;
  gridRow: number;
  width: string;
  height: string;
  isTransom: boolean;
  isActive: boolean;
}

interface GridStats {
  totalMullions: number;
  totalGlassPanels: number;
  totalMullionLength: number;
  totalGlassArea: number;
  totalEstimatedCost: number;
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

interface SimpleGridViewerProps {
  openingId: number;
  openingName: string;
}

const SimpleGridViewer: React.FC<SimpleGridViewerProps> = ({
  openingId,
  openingName,
}) => {
  const [gridData, setGridData] = useState<OpeningWithGrid | null>(null);
  const [stats, setStats] = useState<GridStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGridData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/openings/${openingId}/grid?includeStats=true`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch grid data");
      }

      const data = await response.json();
      console.log("Grid data received:", data);

      setGridData(data.opening);
      setStats(data.stats);
    } catch (err) {
      console.error("Error fetching grid data:", err);
      setError(err instanceof Error ? err.message : "Failed to load grid data");
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
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-center">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" />
          Loading grid data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-red-600 text-sm">Error: {error}</div>
          <button
            onClick={fetchGridData}
            className="ml-auto px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!gridData) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center text-gray-500">No grid data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Grid className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">Grid System</h3>
        </div>
        <button
          onClick={fetchGridData}
          className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Refresh
        </button>
      </div>

      {/* Opening Info */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="font-medium text-gray-900 mb-2">{openingName}</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="text-gray-600">Size:</span>
            <p className="font-medium">
              {gridData.width}' × {gridData.height}'
            </p>
          </div>
          <div>
            <span className="text-gray-600">Grid:</span>
            <p className="font-medium">
              {gridData.gridColumns} × {gridData.gridRows}
            </p>
          </div>
          <div>
            <span className="text-gray-600">Mullion Width:</span>
            <p className="font-medium">{gridData.mullionWidth}"</p>
          </div>
          <div>
            <span className="text-gray-600">Opening ID:</span>
            <p className="font-medium">#{gridData.id}</p>
          </div>
        </div>
      </div>

      {/* Grid Elements Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mullions */}
        <div className="bg-blue-50 rounded-lg p-3">
          <h5 className="font-medium text-blue-900 mb-2">
            Mullions ({gridData.gridMullions?.length || 0})
          </h5>
          <div className="space-y-1 text-sm">
            {gridData.gridMullions?.slice(0, 5).map((mullion) => (
              <div key={mullion.id} className="flex justify-between">
                <span className="text-blue-700 capitalize">
                  {mullion.gridType.replace("_", " ")}
                </span>
                <span className="text-blue-600">
                  {parseFloat(mullion.length).toFixed(1)}'
                </span>
              </div>
            ))}
            {(gridData.gridMullions?.length || 0) > 5 && (
              <div className="text-blue-600 text-xs">
                +{(gridData.gridMullions?.length || 0) - 5} more...
              </div>
            )}
          </div>
        </div>

        {/* Glass Panels */}
        <div className="bg-green-50 rounded-lg p-3">
          <h5 className="font-medium text-green-900 mb-2">
            Glass Panels ({gridData.gridGlassPanels?.length || 0})
          </h5>
          <div className="space-y-1 text-sm">
            {gridData.gridGlassPanels?.slice(0, 5).map((panel) => (
              <div key={panel.id} className="flex justify-between">
                <span className="text-green-700">
                  {panel.isTransom ? "Transom" : "Panel"} {panel.gridRow + 1}-
                  {panel.gridColumn + 1}
                </span>
                <span className="text-green-600">
                  {(parseFloat(panel.width) * parseFloat(panel.height)).toFixed(
                    1
                  )}{" "}
                  sq ft
                </span>
              </div>
            ))}
            {(gridData.gridGlassPanels?.length || 0) > 5 && (
              <div className="text-green-600 text-xs">
                +{(gridData.gridGlassPanels?.length || 0) - 5} more...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h5 className="font-medium text-gray-900 mb-2">Statistics</h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-gray-600">Total Mullion Length:</span>
              <p className="font-medium">
                {stats.totalMullionLength.toFixed(1)}'
              </p>
            </div>
            <div>
              <span className="text-gray-600">Total Glass Area:</span>
              <p className="font-medium">
                {stats.totalGlassArea.toFixed(1)} sq ft
              </p>
            </div>
            <div>
              <span className="text-gray-600">Active Elements:</span>
              <p className="font-medium">
                {stats.totalMullions + stats.totalGlassPanels}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Estimated Cost:</span>
              <p className="font-medium text-green-600">
                ${stats.totalEstimatedCost.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (can remove later) */}
      <details className="text-xs text-gray-500">
        <summary className="cursor-pointer hover:text-gray-700">
          Debug Info
        </summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
          {JSON.stringify({ gridData, stats }, null, 2)}
        </pre>
      </details>
    </div>
  );
};

export default SimpleGridViewer;
