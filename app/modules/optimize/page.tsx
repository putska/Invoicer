// app/bar-optimize/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  optimizeBarsWithPartMatching,
  findOptimalBarsByPartNo,
  createBarsFromOptimalResults,
  findBestBarLength,
} from "../../components/barOptimization";
import { Part, Bar, BarOptimizationResult } from "../../types";
import PartsTable from "../../components/PartsTable";
import BarsTable from "../../components/BarsTable";
import PartsUploadExcel from "../../components/PartsUploadExcel";
import BarCuttingVisualization from "../../components/BarCuttingVisualization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BarOptimizationPage() {
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [bars, setBars] = useState<Bar[]>([]);
  const [kerf, setKerf] = useState(0.1875);
  const [findOptimalBar, setFindOptimalBar] = useState(true);
  const [minLength, setMinLength] = useState(156);
  const [maxLength, setMaxLength] = useState(300);
  const [stepSize, setStepSize] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<BarOptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState("parts");
  const [jobName, setJobName] = useState("Bar Optimization");
  const [findOptimalBarByPart, setFindOptimalBarByPart] = useState(true);

  // Modify the handleOptimize function to update the state after optimization

  const handleOptimize = async () => {
    if (parts.length === 0) {
      alert("Please add parts first");
      return;
    }

    if (!findOptimalBar && bars.length === 0) {
      alert("Please add bar sizes or enable automatic optimization");
      return;
    }

    setIsLoading(true);

    try {
      // If we should find optimal bar length, do that first
      let barsToUse = [...bars];
      let optimizedBars: Bar[] = [];

      if (findOptimalBar) {
        if (findOptimalBarByPart) {
          // Find optimal bar length for each part number
          const optimalBars = findOptimalBarsByPartNo(
            parts,
            minLength,
            maxLength,
            stepSize,
            kerf
          );

          console.log("Optimal bars by part number:", optimalBars);

          // Create bars from optimal results, including any manually defined bars
          barsToUse = createBarsFromOptimalResults(optimalBars, barsToUse);

          // Save the optimized bars for later use
          optimizedBars = [...barsToUse];
        } else {
          // Find a single optimal bar length for all parts
          // Use the same function but just create one "generic" part number
          const optimalBars = findOptimalBarsByPartNo(
            parts.map((p) => ({ ...p, partNo: "ALL_PARTS" })),
            minLength,
            maxLength,
            stepSize,
            kerf
          );

          console.log("Optimal bar length determined:", optimalBars[0]);

          // Create a bar with the optimal length
          barsToUse = [
            {
              id: 1,
              length: optimalBars[0].length,
              qty: 1000, // Set a high quantity for optimization
              description: `Optimal ${optimalBars[0].length}" bar`,
            },
          ];

          // Save the optimized bars for later use
          optimizedBars = [...barsToUse];
        }
      }

      // Run optimization with the prepared bars
      console.log("Running optimization with bars:", barsToUse);
      const result = optimizeBarsWithPartMatching(parts, barsToUse, kerf);
      console.log("Optimization complete:", result);

      // Add cuts to each bar for visualization
      const barsWithCuts = result.bars.map((bar) => {
        return {
          ...bar,
          cuts: result.cuts.filter(
            (cut) => cut.barId === bar.barId && cut.barNo === bar.barNo
          ),
        };
      });

      // Update the results with bars containing cuts
      setResults({
        ...result,
        bars: barsWithCuts,
        // Include the optimal bar info if relevant
        optimalBar:
          findOptimalBar && !findOptimalBarByPart
            ? { length: barsToUse[0].length }
            : undefined,
      });

      // After optimization is completed:
      // 1. Turn off the auto-optimization flags
      // 2. Update the bars state with the optimized bars
      if (findOptimalBar) {
        // This will be executed after optimization is done
        // We need to use setTimeout to avoid state updates during an existing render cycle
        setTimeout(() => {
          // Update the bars with the optimized ones
          setBars(optimizedBars);

          // Turn off the automatic optimization
          setFindOptimalBar(false);
          setFindOptimalBarByPart(false);
        }, 0);
      }

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
      csvContent += "BAR OPTIMIZATION SUMMARY\r\n";
      csvContent += `Job Name,${jobName}\r\n`;
      csvContent += `Total Bars,${results.summary.totalBars}\r\n`;
      csvContent += `Total Length (in),${results.summary.totalLength.toFixed(
        2
      )}\r\n`;
      csvContent += `Total Length (ft),${(
        results.summary.totalLength / 12
      ).toFixed(2)}\r\n`;
      csvContent += `Used Length (in),${results.summary.usedLength.toFixed(
        2
      )}\r\n`;
      csvContent += `Used Length (ft),${(
        results.summary.usedLength / 12
      ).toFixed(2)}\r\n`;
      csvContent += `Waste Percentage,${results.summary.wastePercentage.toFixed(
        2
      )}%\r\n\r\n`;

      // Bars section
      csvContent += "BARS USED\r\n";
      csvContent +=
        "Bar ID,Bar No,Length (in),Length (ft),Used Length (in),Used Length (ft),Waste Percentage\r\n";

      results.bars.forEach((bar) => {
        csvContent += `${bar.barId},${bar.barNo},${bar.length},${(
          bar.length / 12
        ).toFixed(2)},${bar.usedLength.toFixed(2)},${(
          bar.usedLength / 12
        ).toFixed(2)},${bar.wastePercentage.toFixed(2)}%\r\n`;
      });

      csvContent += "\r\nCUT LIST\r\n";
      csvContent +=
        "Bar ID,Bar No,Part ID,Mark No,Part No,Length (in),Length (ft),Position (in),Position (ft),Finish,Fabrication\r\n";

      results.cuts.forEach((cut) => {
        csvContent += `${cut.barId},${cut.barNo},${cut.partId},${cut.markNo},${
          cut.partNo
        },${cut.length},${(cut.length / 12).toFixed(2)},${cut.position},${(
          cut.position / 12
        ).toFixed(2)},${cut.finish || ""},${cut.fab || ""}\r\n`;
      });

      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "bar_optimization_results.csv");
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Extrusion Optimization</h1>
        <a
          href="https://wiki.cse-portal.com/en/Engineering/documentation#extrusion-optimization-instructions"
          className="text-blue-500 underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Instructions
        </a>
      </div>
      <div className="mb-4">
        <Label htmlFor="jobName">Job Name</Label>
        <Input
          id="jobName"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          placeholder="Enter job name"
          className="max-w-md"
        />
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="parts">Parts</TabsTrigger>
          <TabsTrigger value="bars">Bars</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parts">
          <Card>
            <CardHeader>
              <CardTitle>Part Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-2">
                  Upload Part Data from Excel
                </h3>
                <PartsUploadExcel onUpload={setParts} />
              </div>

              <PartsTable parts={parts} onPartsChange={setParts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bars">
          <Card>
            <CardHeader>
              <CardTitle>Extrusion Sizes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="flex items-center space-x-2 mt-2 mb-4">
                  <Checkbox
                    id="findOptimalBar"
                    checked={findOptimalBar}
                    onCheckedChange={(checked) =>
                      setFindOptimalBar(checked as boolean)
                    }
                  />
                  <label htmlFor="findOptimalBar" className="text-sm">
                    Automatically find optimal extrusion length
                    {findOptimalBarByPart && " for each part number"}
                  </label>
                </div>
              </div>
              <BarsTable
                bars={bars}
                onBarsChange={setBars}
                disabled={findOptimalBar}
                parts={parts}
                findOptimalBarByPart={findOptimalBarByPart}
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
                    Kerf (Blade Width in inches)
                  </label>
                  <Input
                    type="number"
                    value={kerf}
                    onChange={(e) => setKerf(parseFloat(e.target.value))}
                    step="0.015625"
                    min="0"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Typical values: 1/8" (0.125), 3/16" (0.1875), 1/4" (0.25)
                  </p>
                </div>

                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="findOptimalBar"
                      checked={findOptimalBar}
                      onCheckedChange={(checked) => {
                        const isChecked = checked as boolean;
                        setFindOptimalBar(isChecked);
                        // If turning off optimal bar, also turn off per-part optimization
                        if (!isChecked) {
                          setFindOptimalBarByPart(false);
                        }
                      }}
                    />
                    <label htmlFor="findOptimalBar" className="text-sm">
                      Automatically find optimal bar length
                    </label>
                  </div>

                  {findOptimalBar && (
                    <div className="flex items-center space-x-2 ml-6">
                      <Checkbox
                        id="findOptimalBarByPart"
                        checked={findOptimalBarByPart}
                        onCheckedChange={(checked) =>
                          setFindOptimalBarByPart(checked as boolean)
                        }
                      />
                      <label htmlFor="findOptimalBarByPart" className="text-sm">
                        Find optimal length for each part number
                      </label>
                    </div>
                  )}
                </div>

                {findOptimalBar && (
                  <>
                    <div>
                      <label className="block text-sm font-medium">
                        Step Size (inches)
                      </label>
                      <Input
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
                        Increment for testing bar lengths (typically 12")
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Minimum Length (inches)
                      </label>
                      <Input
                        type="number"
                        value={minLength}
                        onChange={(e) =>
                          setMinLength(parseFloat(e.target.value))
                        }
                        step="12"
                        min="1"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Shortest bar to consider (e.g., 156" = 13')
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium">
                        Maximum Length (inches)
                      </label>
                      <Input
                        type="number"
                        value={maxLength}
                        onChange={(e) =>
                          setMaxLength(parseFloat(e.target.value))
                        }
                        step="12"
                        min="1"
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Longest bar to consider (e.g., 300" = 25')
                      </p>
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
                        Total Bars Used
                      </p>
                      <p className="text-2xl font-bold">
                        {results.summary.totalBars}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Total Length
                      </p>
                      <p className="text-2xl font-bold">
                        {(results.summary.totalLength / 12).toFixed(2)} ft
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Used Length
                      </p>
                      <p className="text-2xl font-bold">
                        {(results.summary.usedLength / 12).toFixed(2)} ft
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-500">
                        Waste Percentage
                      </p>
                      <p className="text-2xl font-bold">
                        {results.summary.wastePercentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <BarCuttingVisualization
                cuts={results.cuts}
                bars={results.bars}
                kerf={kerf}
                summary={results.summary}
                jobName={jobName}
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleOptimize}
          disabled={isLoading || parts.length === 0}
          className="px-6 py-2"
        >
          {isLoading ? "Optimizing..." : "Run Optimization"}
        </Button>
      </div>
    </div>
  );
}
