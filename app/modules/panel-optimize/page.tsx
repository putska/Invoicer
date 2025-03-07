// app/panel-optimize/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Panel,
  Sheet,
  PanelOptimizationResult,
} from "../../components/panelOptimization";
import PanelsTable from "../../components/PanelsTable";
import SheetsTable from "../../components/SheetsTable";
import PanelUploadExcel from "../../components/PanelUploadExcel";
import CuttingPatternVisualization from "../../components/CuttingPatternVisualization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

export default function PanelOptimizationPage() {
  const router = useRouter();
  const [panels, setPanels] = useState<Panel[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [bladeWidth, setBladeWidth] = useState(0.25);
  const [findOptimalSheet, setFindOptimalSheet] = useState(true);
  const [allowRotation, setAllowRotation] = useState(true);
  const [minWidth, setMinWidth] = useState(48);
  const [maxWidth, setMaxWidth] = useState(96);
  const [minHeight, setMinHeight] = useState(48);
  const [maxHeight, setMaxHeight] = useState(120);
  const [stepSize, setStepSize] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<PanelOptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState("panels");

  const handleOptimize = async () => {
    if (panels.length === 0) {
      alert("Please add panels first");
      return;
    }

    if (!findOptimalSheet && sheets.length === 0) {
      alert("Please add sheet sizes or enable automatic optimization");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/panel-optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          panels,
          sheets,
          bladeWidth,
          allowRotation,
          findOptimalSheet,
          minWidth,
          maxWidth,
          minHeight,
          maxHeight,
          stepSize,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Optimization failed");
      }

      const optimizationResults = await response.json();
      console.log("Optimization results:", optimizationResults);
      setResults(optimizationResults);
      setActiveTab("results");
    } catch (error) {
      console.error("Optimization error:", error);
      alert(
        `Error: ${
          error instanceof Error ? error.message : "Failed to optimize"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportResults = async () => {
    if (!results) {
      alert("No results to export");
      return;
    }

    try {
      // Create CSV content
      let csvContent = "data:text/csv;charset=utf-8,";

      // Summary section
      csvContent += "PANEL OPTIMIZATION SUMMARY\r\n";
      csvContent += `Total Sheets,${results.summary.totalSheets}\r\n`;
      csvContent += `Total Area (sq in),${results.summary.totalArea.toFixed(
        2
      )}\r\n`;
      csvContent += `Used Area (sq in),${results.summary.usedArea.toFixed(
        2
      )}\r\n`;
      csvContent += `Waste Percentage,${results.summary.wastePercentage.toFixed(
        2
      )}%\r\n\r\n`;

      // Sheets section
      csvContent += "SHEETS USED\r\n";
      csvContent +=
        "Sheet ID,Sheet No,Width,Height,Used Area,Waste Percentage\r\n";

      results.sheets.forEach((sheet) => {
        csvContent += `${sheet.sheetId},${sheet.sheetNo},${sheet.width},${
          sheet.height
        },${sheet.usedArea.toFixed(2)},${sheet.wastePercentage.toFixed(
          2
        )}%\r\n`;
      });

      csvContent += "\r\nPANEL PLACEMENTS\r\n";
      csvContent +=
        "Sheet ID,Sheet No,Panel ID,Mark,Width,Height,X Position,Y Position,Rotated\r\n";

      results.placements.forEach((placement) => {
        csvContent += `${placement.sheetId},${placement.sheetNo},${
          placement.panelId
        },${placement.mark},${placement.width},${placement.height},${
          placement.x
        },${placement.y},${placement.rotated ? "Yes" : "No"}\r\n`;
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "panel_optimization_results.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export results");
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Panel Optimization</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="panels">Panels</TabsTrigger>
          <TabsTrigger value="sheets">Sheets</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="panels">
          <Card>
            <CardHeader>
              <CardTitle>Panel Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">
                  Enter the dimensions and quantities of panels to optimize.
                  Each panel must have a width, height, and quantity.
                </p>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox
                    id="allowRotation"
                    checked={allowRotation}
                    onCheckedChange={(checked) =>
                      setAllowRotation(checked as boolean)
                    }
                  />
                  <label htmlFor="allowRotation" className="text-sm">
                    Allow panel rotation (panels can be placed in either
                    orientation)
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">
                  Upload Panel Data from Excel
                </h3>
                <PanelUploadExcel onUpload={setPanels} />
              </div>

              <PanelsTable panels={panels} onPanelsChange={setPanels} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sheets">
          <Card>
            <CardHeader>
              <CardTitle>Sheet Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Define the sheet sizes available for cutting panels.
                </p>
                <div className="flex items-center space-x-2 mt-2 mb-4">
                  <Checkbox
                    id="findOptimalSheet"
                    checked={findOptimalSheet}
                    onCheckedChange={(checked) =>
                      setFindOptimalSheet(checked as boolean)
                    }
                  />
                  <label htmlFor="findOptimalSheet" className="text-sm">
                    Automatically find optimal sheet size
                  </label>
                </div>
              </div>
              <SheetsTable
                sheets={sheets}
                onSheetsChange={setSheets}
                disabled={findOptimalSheet}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">
                    Blade Width (inches)
                  </label>
                  <input
                    type="number"
                    value={bladeWidth}
                    onChange={(e) => setBladeWidth(parseFloat(e.target.value))}
                    step="0.0625"
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Space between panels for cutting
                  </p>
                </div>

                {findOptimalSheet && (
                  <>
                    <div>
                      <label className="block text-sm font-medium">
                        Step Size (inches)
                      </label>
                      <input
                        type="number"
                        value={stepSize}
                        onChange={(e) =>
                          setStepSize(parseFloat(e.target.value))
                        }
                        step="1"
                        min="1"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Increment for testing sheet sizes
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Minimum Width (inches)
                      </label>
                      <input
                        type="number"
                        value={minWidth}
                        onChange={(e) =>
                          setMinWidth(parseFloat(e.target.value))
                        }
                        step="1"
                        min="1"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Maximum Width (inches)
                      </label>
                      <input
                        type="number"
                        value={maxWidth}
                        onChange={(e) =>
                          setMaxWidth(parseFloat(e.target.value))
                        }
                        step="1"
                        min="1"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Minimum Height (inches)
                      </label>
                      <input
                        type="number"
                        value={minHeight}
                        onChange={(e) =>
                          setMinHeight(parseFloat(e.target.value))
                        }
                        step="1"
                        min="1"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Maximum Height (inches)
                      </label>
                      <input
                        type="number"
                        value={maxHeight}
                        onChange={(e) =>
                          setMaxHeight(parseFloat(e.target.value))
                        }
                        step="1"
                        min="1"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                      />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          {results && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Optimization Results</CardTitle>
                    <Button size="sm" onClick={handleExportResults}>
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Total Sheets Used
                      </p>
                      <p className="text-2xl font-bold">
                        {results.summary.totalSheets}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Total Area
                      </p>
                      <p className="text-2xl font-bold">
                        {results.summary.totalArea.toFixed(2)} sq in
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Used Area
                      </p>
                      <p className="text-2xl font-bold">
                        {results.summary.usedArea.toFixed(2)} sq in
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Waste Percentage
                      </p>
                      <p className="text-2xl font-bold">
                        {results.summary.wastePercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {results.optimalSheet && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="text-lg font-medium text-green-800 mb-2">
                        Optimal Sheet Size
                      </h3>
                      <p className="text-green-700">
                        The optimal sheet size for your panels is{" "}
                        <strong>
                          {results.optimalSheet.width}" ×{" "}
                          {results.optimalSheet.height}"
                        </strong>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <CuttingPatternVisualization
                placements={results.placements}
                sheets={results.sheets}
                bladeWidth={bladeWidth}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleOptimize}
          disabled={isLoading || panels.length === 0}
          className="px-6 py-2"
        >
          {isLoading ? "Optimizing..." : "Run Optimization"}
        </Button>
      </div>
    </div>
  );
}
