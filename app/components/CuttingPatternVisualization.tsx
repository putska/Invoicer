// components/CuttingPatternVisualization.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Placement, CutSheet } from "../types";
import ExportPdfPatterns from "./ExportPdfPatterns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { JobContextImpl } from "twilio/lib/rest/bulkexports/v1/export/job";

interface CuttingPatternVisualizationProps {
  placements: Placement[];
  sheets: CutSheet[];
  bladeWidth?: number;
  summary: {
    totalSheets: number;
    totalArea: number;
    usedArea: number;
    wastePercentage: number;
    totalPanelsPlaced: number;
    totalPanelsNeeded: number;
    sheetTypesUsed: number;
  };
  jobName: string; // Added jobName property
  allowRotation: boolean;
}

// Helper function to convert square inches to square feet
const sqInToSqFt = (sqIn: number): number => sqIn / 144;

export default function CuttingPatternVisualization({
  placements,
  sheets,
  bladeWidth = 0.25,
  summary,
  jobName = "Panel Optimization",
  allowRotation = true,
}: CuttingPatternVisualizationProps) {
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [showDimensions, setShowDimensions] = useState<"inches" | "feet">(
    "inches"
  );

  // Count total number of placed panels if not provided in summary
  const countPlacedPanels = (): number => {
    // Count unique panel IDs from placements
    const panelIds = new Set(placements.map((p) => p.panelId));
    return panelIds.size;
  };

  // Helper to count panel occurrences
  const getPanelCount = (panelId: number): number => {
    return placements.filter((p) => p.panelId === panelId).length;
  };

  // Get unique panels (deduplicated by panelId)
  const getUniquePanels = (): Placement[] => {
    const uniqueMap = new Map<number, Placement>();

    placements.forEach((placement) => {
      if (!uniqueMap.has(placement.panelId)) {
        uniqueMap.set(placement.panelId, placement);
      }
    });

    return Array.from(uniqueMap.values());
  };

  // Format dimension based on current display mode
  const formatDimension = (inches: number): string => {
    if (showDimensions === "inches") {
      return `${inches.toFixed(2)}"`;
    } else {
      const feet = inches / 12;
      return `${feet.toFixed(2)}'`;
    }
  };

  // Format area based on current display mode
  const formatArea = (squareInches: number): string => {
    if (showDimensions === "inches") {
      return `${squareInches.toFixed(2)} sq.in.`;
    } else {
      const squareFeet = sqInToSqFt(squareInches);
      return `${squareFeet.toFixed(2)} sq.ft.`;
    }
  };

  // Group placements by sheet
  const placementsBySheet = sheets.map((sheet) => {
    // Find all placements for this specific sheet
    const sheetPlacements = placements.filter(
      (p) => p.sheetId === sheet.sheetId && p.sheetNo === sheet.sheetNo
    );

    // Calculate actual used area from placements if it's zero
    let usedArea = sheet.usedArea;
    if (usedArea === 0 && sheetPlacements.length > 0) {
      usedArea = sheetPlacements.reduce(
        (sum, p) => sum + p.width * p.height,
        0
      );
    }

    // Calculate waste percentage if it's zero
    let wastePercentage = sheet.wastePercentage;
    if (wastePercentage === 0 && sheet.width > 0 && sheet.height > 0) {
      const totalArea = sheet.width * sheet.height;
      wastePercentage =
        totalArea > 0 ? ((totalArea - usedArea) / totalArea) * 100 : 0;
    }

    // Return enhanced sheet data with placements
    return {
      sheet: {
        ...sheet,
        usedArea,
        wastePercentage,
      },
      placements: sheetPlacements,
    };
  });

  const currentSheet = placementsBySheet[currentSheetIndex]?.sheet;
  const currentPlacements =
    placementsBySheet[currentSheetIndex]?.placements || [];

  const navigatePrevious = () => {
    setCurrentSheetIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const navigateNext = () => {
    setCurrentSheetIndex((prev) =>
      prev < placementsBySheet.length - 1 ? prev + 1 : prev
    );
  };

  // Calculate scale factor for the visualization
  const maxDimension = 600; // Max width/height for the visualization in pixels
  const scale = Math.min(
    maxDimension / (currentSheet?.width || 1),
    maxDimension / (currentSheet?.height || 1)
  );

  // Calculate colors for panels based on their mark to ensure consistency
  const getColorForPanel = (panelId: number, mark: string) => {
    // Create a stable color mapping based on mark
    const markColors = {
      A1: "bg-blue-500",
      A2: "bg-green-500",
      A3: "bg-yellow-500",
      A4: "bg-red-500",
      A5: "bg-purple-500",
      A6: "bg-pink-500",
      A7: "bg-indigo-500",
      A8: "bg-orange-500",
    };

    // If mark exists in our mapping, use that
    if (mark && markColors[mark as keyof typeof markColors]) {
      return markColors[mark as keyof typeof markColors];
    }

    // Fallback to ID-based coloring
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-red-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ];
    return colors[Math.abs(panelId) % colors.length];
  };

  // Export cutting pattern as SVG
  const exportAsSVG = () => {
    if (!currentSheet) return;

    const svgWidth = currentSheet.width;
    const svgHeight = currentSheet.height;

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">`;

    // Add sheet background
    svgContent += `<rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" fill="#f0f0f0" stroke="#000000" stroke-width="0.5" />`;

    // Add panels
    for (const placement of currentPlacements) {
      // Generate a color based on panel ID (using HSL for better distribution)
      const hue = (Math.abs(placement.panelId) * 137.5) % 360;
      const color = `hsl(${hue}, 70%, 60%)`;

      svgContent += `<g>
        <rect x="${placement.x}" y="${placement.y}" width="${
        placement.width
      }" height="${
        placement.height
      }" fill="${color}" stroke="#000000" stroke-width="0.25" />
        <text x="${placement.x + placement.width / 2}" y="${
        placement.y + placement.height / 2
      }" font-family="Arial" font-size="${
        Math.min(placement.width, placement.height) * 0.15
      }" text-anchor="middle" dominant-baseline="middle" fill="#000000">
          ${placement.mark}
        </text>
      </g>`;
    }

    svgContent += "</svg>";

    // Create download link
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cutting-pattern-sheet-${currentSheet.sheetNo}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (sheets.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            No cutting patterns to display. Run optimization first.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get total area values in square feet
  const totalAreaSqFt = sqInToSqFt(summary?.totalArea || 0);
  const usedAreaSqFt = sqInToSqFt(summary?.usedArea || 0);

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Cutting Pattern Visualization</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setShowDimensions(
                  showDimensions === "inches" ? "feet" : "inches"
                )
              }
            >
              Show in {showDimensions === "inches" ? "Feet" : "Inches"}
            </Button>

            <ExportPdfPatterns
              sheets={sheets}
              placements={placements}
              jobName={jobName}
            />

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={navigatePrevious}
                disabled={currentSheetIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Sheet {currentSheetIndex + 1} of {placementsBySheet.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={navigateNext}
                disabled={currentSheetIndex === placementsBySheet.length - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Information */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Optimization Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Sheets</div>
              <div className="text-xl font-semibold">
                {summary?.totalSheets || sheets.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Panels</div>
              <div className="text-xl font-semibold">
                {summary?.totalPanelsPlaced || countPlacedPanels()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Area</div>
              <div className="text-xl font-semibold">
                {formatArea(summary?.totalArea || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Used Area</div>
              <div className="text-xl font-semibold">
                {formatArea(summary?.usedArea || 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Waste</div>
              <div className="text-xl font-semibold">
                {summary?.wastePercentage !== undefined &&
                summary.wastePercentage >= 0
                  ? summary.wastePercentage.toFixed(2)
                  : "0.00"}
                %
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Unique Panel Types</div>
              <div className="text-xl font-semibold">
                {getUniquePanels().length}
              </div>
            </div>
            {summary?.totalPanelsNeeded && (
              <div>
                <div className="text-sm text-gray-500">Total Panels Needed</div>
                <div className="text-xl font-semibold">
                  {summary.totalPanelsNeeded}
                </div>
              </div>
            )}
          </div>
        </div>

        {currentSheet && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="font-medium">Sheet Size:</span>{" "}
                {formatDimension(currentSheet.width)} ×{" "}
                {formatDimension(currentSheet.height)}
              </div>
              <div>
                <span className="font-medium">Sheet Number:</span>{" "}
                {currentSheet.sheetNo}
              </div>
              <div>
                <span className="font-medium">Used Area:</span>{" "}
                {formatArea(currentSheet.usedArea)}
              </div>
              <div>
                <span className="font-medium">Waste:</span>{" "}
                {currentSheet.wastePercentage.toFixed(2)}%
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <div
                className="relative bg-gray-100"
                style={{
                  width: `${currentSheet.width * scale}px`,
                  height: `${currentSheet.height * scale}px`,
                }}
              >
                {/* Sheet background */}
                <div
                  className="absolute inset-0 border border-gray-300"
                  style={{
                    width: `${currentSheet.width * scale}px`,
                    height: `${currentSheet.height * scale}px`,
                  }}
                />

                {/* Panels */}
                {currentPlacements.map((placement, index) => (
                  <div
                    key={`${placement.panelId}-${index}`}
                    className={`absolute border border-gray-700 ${getColorForPanel(
                      placement.panelId,
                      placement.mark
                    )} flex items-center justify-center text-white text-xs font-medium`}
                    style={{
                      left: `${placement.x * scale}px`,
                      top: `${placement.y * scale}px`,
                      width: `${placement.width * scale}px`,
                      height: `${placement.height * scale}px`,
                    }}
                    title={`${placement.mark}: ${placement.width}"×${placement.height}"`}
                  >
                    <div className="truncate px-1">
                      {placement.mark}
                      <br />
                      {showDimensions === "inches"
                        ? `${placement.width.toFixed(
                            1
                          )}×${placement.height.toFixed(1)}`
                        : `${(placement.width / 12).toFixed(1)}×${(
                            placement.height / 12
                          ).toFixed(1)}`}
                    </div>
                  </div>
                ))}

                {/* Cutting blade visualization */}
                {currentPlacements.map((placement, index) => (
                  <React.Fragment key={`blade-${placement.panelId}-${index}`}>
                    {/* Right blade */}
                    {placement.x + placement.width < currentSheet.width && (
                      <div
                        className="absolute bg-gray-400"
                        style={{
                          left: `${(placement.x + placement.width) * scale}px`,
                          top: `${placement.y * scale}px`,
                          width: `${bladeWidth * scale}px`,
                          height: `${placement.height * scale}px`,
                        }}
                      />
                    )}
                    {/* Bottom blade */}
                    {placement.y + placement.height < currentSheet.height && (
                      <div
                        className="absolute bg-gray-400"
                        style={{
                          left: `${placement.x * scale}px`,
                          top: `${(placement.y + placement.height) * scale}px`,
                          width: `${placement.width * scale}px`,
                          height: `${bladeWidth * scale}px`,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">
            Panel List for This Sheet
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 border border-gray-300 text-left">
                    Mark
                  </th>
                  <th className="px-4 py-2 border border-gray-300 text-left">
                    Width
                  </th>
                  <th className="px-4 py-2 border border-gray-300 text-left">
                    Height
                  </th>
                  <th className="px-4 py-2 border border-gray-300 text-left">
                    Position (X,Y)
                  </th>
                  <th className="px-4 py-2 border border-gray-300 text-left">
                    Rotated
                  </th>
                  <th className="px-4 py-2 border border-gray-300 text-left">
                    Area
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Show each panel placement individually, no grouping */}
                {currentPlacements.map((placement, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border border-gray-300">
                      {placement.mark}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {placement.width}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {placement.height}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      ({placement.x}, {placement.y})
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      {placement.rotated ? "Yes" : "No"}
                    </td>
                    <td className="px-4 py-2 border border-gray-300 font-medium">
                      {formatArea(placement.width * placement.height)}
                    </td>
                  </tr>
                ))}
                {currentPlacements.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-2 border border-gray-300 text-center text-gray-500"
                    >
                      No panels on this sheet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Temporary debug info */}
        {/* 
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h4 className="font-bold">Debug Info:</h4>
          <pre className="text-xs overflow-auto">{debugInfo}</pre>
        </div>
        */}
      </CardContent>
    </Card>
  );
}
