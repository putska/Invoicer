// components/estimating/grid/GridStatistics.tsx
"use client";

import React from "react";

interface GridMullion {
  id: number;
  gridType: string;
  isActive: boolean;
}

interface GridGlassPanel {
  id: number;
  isActive: boolean;
}

interface GridStatisticsProps {
  allMullions: GridMullion[];
  activeGlassPanels: GridGlassPanel[];
  openingWidth: number;
  openingHeight: number;
}

export const GridStatistics: React.FC<GridStatisticsProps> = ({
  allMullions,
  activeGlassPanels,
  openingWidth,
  openingHeight,
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">Grid Statistics</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Glass Panels:</span>
          <p className="font-medium">{activeGlassPanels.length}</p>
        </div>
        <div>
          <span className="text-gray-600">Active Mullions:</span>
          <p className="font-medium">
            {allMullions.filter((m) => m.isActive).length}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Inactive Mullions:</span>
          <p className="font-medium text-gray-500">
            {allMullions.filter((m) => !m.isActive).length}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Opening Area:</span>
          <p className="font-medium">
            {(openingWidth * openingHeight).toFixed(1)} sq ft
          </p>
        </div>
      </div>

      {/* Mullion breakdown */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h5 className="text-sm font-medium text-gray-700 mb-2">
          Mullion Types:
        </h5>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          {[
            "vertical",
            "horizontal",
            "sill",
            "head",
            "jamb_left",
            "jamb_right",
          ].map((type) => {
            const count = allMullions.filter(
              (m) => m.gridType === type && m.isActive
            ).length;
            const inactiveCount = allMullions.filter(
              (m) => m.gridType === type && !m.isActive
            ).length;
            if (count > 0 || inactiveCount > 0) {
              return (
                <div key={type} className="text-gray-600">
                  <span className="capitalize">{type.replace("_", " ")}:</span>
                  <span className="ml-1 font-medium">{count}</span>
                  {inactiveCount > 0 && (
                    <span className="ml-1 text-gray-400">
                      ({inactiveCount} off)
                    </span>
                  )}
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </div>
  );
};
