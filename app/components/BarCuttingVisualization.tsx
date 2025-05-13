"use client";

import React, { useState, useEffect } from "react";
import { BarCut, CutBar, BarOptimizationResult } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { decimalToFraction } from "./formatters";
import ExportPdfBars from "./ExportPdfBars";

interface BarCuttingVisualizationProps {
  cuts: BarCut[];
  bars: CutBar[];
  kerf: number;
  summary?: BarOptimizationResult["summary"];
  jobName?: string;
}

// Helper function to convert square inches to square feet
const inToFt = (inches: number): number => inches / 12;

export default function BarCuttingVisualization({
  cuts,
  bars,
  kerf,
  summary,
  jobName = "Bar Optimization",
}: BarCuttingVisualizationProps) {
  const [currentBarIndex, setCurrentBarIndex] = useState(0);
  const [groupByFinish, setGroupByFinish] = useState(true);

  // Scaling factor for visualization
  const SCALE_FACTOR = 4.5; // Double the size

  // Group bars by barId and barNo
  const barsBySize = groupByFinish
    ? groupBarsByPartNoAndFinish(bars)
    : [
        {
          finishName: "All Finishes",
          bars: [...bars],
        },
      ];

  // Determine which bars to display
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);

  useEffect(() => {
    // Reset indices when data changes
    setCurrentGroupIndex(0);
    setCurrentBarIndex(0);
  }, [cuts, bars]);

  if (!barsBySize[currentGroupIndex]) {
    setCurrentGroupIndex(0);
  }

  const currentGroup = barsBySize[currentGroupIndex] || {
    finishName: "No Data",
    bars: [],
  };
  const currentBar = currentGroup.bars[currentBarIndex];

  const navigatePreviousBar = () => {
    if (currentBarIndex > 0) {
      setCurrentBarIndex(currentBarIndex - 1);
    }
  };

  const navigateNextBar = () => {
    if (currentBarIndex < currentGroup.bars.length - 1) {
      setCurrentBarIndex(currentBarIndex + 1);
    }
  };

  const navigatePreviousGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
      setCurrentBarIndex(0);
    }
  };

  const navigateNextGroup = () => {
    if (currentGroupIndex < barsBySize.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentBarIndex(0);
    }
  };

  // Export cutting diagram as SVG
  const exportAsSVG = () => {
    if (!currentBar) return;

    const barLength = currentBar.length;
    const svgWidth = barLength + 40; // Add margin
    const svgHeight = 150; // Fixed height

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">`;

    // Add title and metadata
    svgContent += `
      <text x="10" y="20" font-family="Arial" font-size="14" font-weight="bold">Bar ${
        currentBar.barId
      }-${currentBar.barNo}, Length: ${decimalToFraction(barLength)}"</text>
      <text x="10" y="40" font-family="Arial" font-size="12">Waste: ${currentBar.wastePercentage.toFixed(
        1
      )}%</text>
    `;

    // Add bar
    svgContent += `<rect x="20" y="60" width="${barLength}" height="40" fill="#f0f0f0" stroke="#000000" stroke-width="1" />`;

    // Add cuts
    const barCuts = cuts
      .filter(
        (c) => c.barId === currentBar.barId && c.barNo === currentBar.barNo
      )
      .sort((a, b) => a.position - b.position);

    let position = 20; // Start position (with margin)

    for (const cut of barCuts) {
      // Generate color based on mark
      const hue = (cut.markNo.charCodeAt(0) * 10) % 360;
      const color = `hsl(${hue}, 70%, 60%)`;

      svgContent += `
        <rect x="${position}" y="60" width="${
        cut.length
      }" height="40" fill="${color}" stroke="#000000" stroke-width="0.5" />
        <text x="${
          position + cut.length / 2
        }" y="80" font-family="Arial" font-size="11" text-anchor="middle" dominant-baseline="middle">
          ${cut.markNo}
        </text>
        <text x="${
          position + cut.length / 2
        }" y="95" font-family="Arial" font-size="9" text-anchor="middle" dominant-baseline="middle">
          ${decimalToFraction(cut.length)}"
        </text>
      `;

      // Add part number if different from mark
      if (cut.partNo && cut.partNo !== cut.markNo) {
        svgContent += `
          <text x="${
            position + cut.length / 2
          }" y="110" font-family="Arial" font-size="8" text-anchor="middle" dominant-baseline="middle" fill="#666666">
            ${cut.partNo}
          </text>
        `;
      }

      // Add kerf marker
      position += cut.length;
      if (position < 20 + barLength) {
        svgContent += `
          <rect x="${position}" y="60" width="${kerf}" height="40" fill="#333333" stroke="none" />
        `;
        position += kerf;
      }
    }

    // Add measurement scale at bottom
    svgContent += `<line x1="20" y1="120" x2="${
      20 + barLength
    }" y2="120" stroke="#000000" stroke-width="1" />`;

    // Add 12" increments
    for (let i = 0; i <= Math.floor(barLength / 12); i++) {
      const x = 20 + i * 12;
      svgContent += `
        <line x1="${x}" y1="120" x2="${x}" y2="125" stroke="#000000" stroke-width="1" />
        <text x="${x}" y="140" font-family="Arial" font-size="10" text-anchor="middle">${i}'</text>
      `;
    }

    svgContent += "</svg>";

    // Create download link
    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bar-${currentBar.barId}-${currentBar.barNo}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (bars.length === 0) {
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

  // Group current bars by finish for summary display
  const barsByFinish = barsBySize.map((group) => {
    const totalLength = group.bars.reduce((sum, b) => sum + b.length, 0);
    const usedLength = group.bars.reduce((sum, b) => sum + b.usedLength, 0);
    const wastePercentage = 100 * (1 - usedLength / totalLength);

    return {
      finish: group.finishName,
      barCount: group.bars.length,
      totalLength,
      usedLength,
      wastePercentage,
    };
  });

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Cutting Pattern Visualization</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGroupByFinish(!groupByFinish)}
            >
              {groupByFinish ? "Show All Together" : "Group by Finish"}
            </Button>

            <div className="flex items-center space-x-2">
              {barsBySize.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigatePreviousGroup}
                    disabled={currentGroupIndex === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm whitespace-nowrap">
                    {currentGroup.finishName} {currentGroupIndex + 1} of{" "}
                    {barsBySize.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={navigateNextGroup}
                    disabled={currentGroupIndex === barsBySize.length - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              <div className="mx-2 border-l border-gray-300 h-6"></div>
              <Button
                variant="outline"
                size="sm"
                onClick={navigatePreviousBar}
                disabled={currentBarIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Bar {currentBarIndex + 1} of {currentGroup.bars.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={navigateNextBar}
                disabled={currentBarIndex === currentGroup.bars.length - 1}
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
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <div className="text-sm text-gray-500">Total Bars</div>
              <div className="text-xl font-semibold">
                {summary?.totalBars || bars.length}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Parts</div>
              <div className="text-xl font-semibold">
                {summary?.totalPartsNeeded || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Parts Placed</div>
              <div className="text-xl font-semibold">
                {summary?.totalPartsPlaced || 0}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Length</div>
              <div className="text-xl font-semibold">
                {summary
                  ? inToFt(summary.totalLength).toFixed(2)
                  : inToFt(bars.reduce((sum, b) => sum + b.length, 0)).toFixed(
                      2
                    )}{" "}
                ft
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Waste Percentage</div>
              <div className="text-xl font-semibold">
                {summary?.wastePercentage !== undefined
                  ? summary.wastePercentage.toFixed(1)
                  : (
                      100 *
                      (1 -
                        bars.reduce((sum, b) => sum + b.usedLength, 0) /
                          bars.reduce((sum, b) => sum + b.length, 0))
                    ).toFixed(1)}
                %
              </div>
            </div>
          </div>

          {barsByFinish.length > 1 && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium mb-2">Breakdown by Finish</h4>
              <div className="grid grid-cols-6 gap-2 text-sm">
                <div className="font-medium">Finish</div>
                <div className="font-medium">Bars</div>
                <div className="font-medium">Bar Length</div>
                <div className="font-medium">Total Length</div>
                <div className="font-medium">Used Length</div>
                <div className="font-medium">Waste %</div>

                {barsByFinish.map((finish, index) => {
                  // Find all bar lengths for this finish group
                  const barsInGroup = barsBySize[index]?.bars || [];

                  // Get unique bar lengths
                  const uniqueBarLengths = Array.from(
                    new Set(barsInGroup.map((bar) => bar.length))
                  ).sort((a, b) => b - a); // Sort descending

                  // Format the bar lengths for display
                  const barLengthsDisplay = uniqueBarLengths
                    .map(
                      (length) => `${length}" (${inToFt(length).toFixed(2)} ft)`
                    )
                    .join(", ");

                  return (
                    <React.Fragment key={index}>
                      <div>{finish.finish}</div>
                      <div>{finish.barCount}</div>
                      <div>{barLengthsDisplay || "N/A"}</div>
                      <div>{inToFt(finish.totalLength).toFixed(2)} ft</div>
                      <div>{inToFt(finish.usedLength).toFixed(2)} ft</div>
                      <div>{finish.wastePercentage.toFixed(1)}%</div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {currentBar && (
          <>
            <div className="mb-4">
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div>
                  <span className="font-medium">Bar Length:</span>{" "}
                  {decimalToFraction(currentBar.length)}" (
                  {inToFt(currentBar.length).toFixed(2)} ft)
                </div>
                <div>
                  <span className="font-medium">Bar ID:</span>{" "}
                  {currentBar.barId}-{currentBar.barNo}
                </div>
                <div>
                  <span className="font-medium">Waste:</span>{" "}
                  {currentBar.wastePercentage.toFixed(1)}%
                </div>
              </div>

              {/* Bar visualization - SCALED by factor of 2 */}
              <div className="rounded-lg border overflow-x-auto">
                <div className="min-w-full p-4">
                  <div
                    className="w-full relative h-20 bg-gray-100 border border-gray-300"
                    style={{
                      minWidth: `${Math.max(
                        currentBar.length * SCALE_FACTOR + 4,
                        500
                      )}px`,
                    }}
                  >
                    {/* Draw each cut - SCALED */}
                    {cuts
                      .filter(
                        (c) =>
                          c.barId === currentBar.barId &&
                          c.barNo === currentBar.barNo
                      )
                      .sort((a, b) => a.position - b.position)
                      .map((cut, index, array) => {
                        // Generate a deterministic color for each cut's mark
                        const hue = (cut.markNo.charCodeAt(0) * 10) % 360;
                        const color = `hsl(${hue}, 70%, 60%)`;

                        // Calculate position including all previous cuts and kerfs - SCALED
                        const prevCuts = array.slice(0, index);
                        const prevLength = prevCuts.reduce(
                          (sum, c) => sum + c.length,
                          0
                        );
                        const prevKerfs = index * kerf;
                        const position =
                          (prevLength + prevKerfs) * SCALE_FACTOR;

                        return (
                          <React.Fragment key={index}>
                            <div
                              className="absolute top-0 h-full border-r border-gray-400 flex items-center justify-center text-xs font-medium"
                              style={{
                                left: `${position}px`,
                                width: `${cut.length * SCALE_FACTOR}px`,
                                backgroundColor: color,
                                color: "white",
                                zIndex: 1,
                              }}
                              title={`${cut.markNo}: ${cut.length}"`}
                            >
                              <div className="truncate px-1">
                                {cut.markNo} <br />
                                {decimalToFraction(cut.length)}"
                              </div>
                            </div>

                            {/* Add kerf marker if not the last cut - SCALED */}
                            {index < array.length - 1 && (
                              <div
                                className="absolute top-0 h-full bg-gray-800"
                                style={{
                                  left: `${
                                    position + cut.length * SCALE_FACTOR
                                  }px`,
                                  width: `${kerf * SCALE_FACTOR}px`,
                                  zIndex: 2,
                                }}
                                title={`Kerf: ${kerf}"`}
                              ></div>
                            )}
                          </React.Fragment>
                        );
                      })}

                    {/* Measurement scale - SCALED */}
                    <div className="absolute top-full left-0 right-0 h-6 flex">
                      {Array.from({
                        length: Math.ceil(currentBar.length / 12) + 1,
                      }).map((_, i) => (
                        <div key={i} className="relative">
                          <div
                            className="absolute top-0 w-px h-2 bg-gray-500"
                            style={{ left: `${i * 12 * SCALE_FACTOR}px` }}
                          ></div>
                          <div
                            className="absolute top-2 text-xs text-gray-600"
                            style={{
                              left: `${i * 12 * SCALE_FACTOR}px`,
                              transform: "translateX(-50%)",
                            }}
                          >
                            {i}'
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cut list for current bar */}
            <div className="mt-8">
              <h3 className="text-lg font-medium mb-2">
                Cut List for This Bar
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 border border-gray-300 text-left">
                        Mark
                      </th>
                      <th className="px-4 py-2 border border-gray-300 text-left">
                        Part No
                      </th>
                      <th className="px-4 py-2 border border-gray-300 text-left">
                        Length
                      </th>
                      <th className="px-4 py-2 border border-gray-300 text-left">
                        Position
                      </th>
                      {groupByFinish && (
                        <th className="px-4 py-2 border border-gray-300 text-left">
                          Finish
                        </th>
                      )}
                      <th className="px-4 py-2 border border-gray-300 text-left">
                        Fabrication
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cuts
                      .filter(
                        (c) =>
                          c.barId === currentBar.barId &&
                          c.barNo === currentBar.barNo
                      )
                      .sort((a, b) => a.position - b.position)
                      .map((cut, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 border border-gray-300">
                            {cut.markNo}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {cut.partNo}
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {decimalToFraction(cut.length)}" (
                            {inToFt(cut.length).toFixed(2)} ft)
                          </td>
                          <td className="px-4 py-2 border border-gray-300">
                            {inToFt(cut.position).toFixed(2)} ft
                          </td>
                          {groupByFinish && (
                            <td className="px-4 py-2 border border-gray-300">
                              {cut.finish || "-"}
                            </td>
                          )}
                          <td className="px-4 py-2 border border-gray-300">
                            {cut.fab || "-"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to group bars by finish
// Updated function to group bars by both partNo and finish
function groupBarsByPartNoAndFinish(
  bars: CutBar[]
): { finishName: string; bars: CutBar[] }[] {
  // Create a map of bars by barId and barNo
  const barMap = new Map<string, CutBar>();
  bars.forEach((bar) => {
    const key = `${bar.barId}-${bar.barNo}`;
    barMap.set(key, bar);
  });

  // Group by partNo+finish (using the cuts to determine this)
  const groupedBars: Record<string, CutBar[]> = {};

  bars.forEach((bar) => {
    // Get the cuts for this bar
    const cuts = bar.cuts || [];

    // If there are no cuts, use "No Data" as the group key
    if (cuts.length === 0) {
      const groupKey = "No Data";
      if (!groupedBars[groupKey]) {
        groupedBars[groupKey] = [];
      }
      groupedBars[groupKey].push(bar);
      return;
    }

    // Look at the first cut to determine the partNo and finish for this bar
    // Assuming all cuts on a bar have the same partNo and finish (due to optimization constraints)
    const firstCut = cuts[0];
    const partNo = firstCut.partNo || "No Part No";
    const finish = firstCut.finish || "No Finish";

    // Create a group key combining partNo and finish
    const groupKey = `${partNo} - ${finish}`;

    if (!groupedBars[groupKey]) {
      groupedBars[groupKey] = [];
    }
    groupedBars[groupKey].push(bar);
  });

  // Convert to array format
  return Object.entries(groupedBars).map(([key, groupBars]) => ({
    finishName: key,
    bars: groupBars,
  }));
}
