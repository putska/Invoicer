// app/optimize/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
// Import only the UI components initially
import { Part, ExtListItem, OptimizationResult } from "../../types";
import OptimizationResults from "../../components/OptimizationResults";
import UploadExcel from "../../components/UploadExcel";
import PartsTable from "../../components/PartsTable";
import StockLengthsTable from "../../components/StockLengthsTable";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";

export default function OptimizationPage() {
  const router = useRouter();
  const [parts, setParts] = useState<Part[]>([]);
  const [stockLengths, setStockLengths] = useState<ExtListItem[]>([]);
  const [bladeWidth, setBladeWidth] = useState(0.25);
  const [findOptimalLength, setFindOptimalLength] = useState(true);
  const [minLength, setMinLength] = useState(180);
  const [maxLength, setMaxLength] = useState(300);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<OptimizationResult | null>(null);
  const [activeTab, setActiveTab] = useState("parts");

  const handlePartsUpload = (uploadedParts: Part[]) => {
    setParts(uploadedParts);

    // Extract unique part numbers and finishes for stock length setup
    const uniqueParts = uploadedParts.reduce(
      (acc: { part_no: string; finish: string }[], part) => {
        const exists = acc.some(
          (p) => p.part_no === part.part_no && p.finish === part.finish
        );
        if (!exists) {
          acc.push({ part_no: part.part_no, finish: part.finish });
        }
        return acc;
      },
      []
    );

    // Create initial stock lengths if none exist
    if (stockLengths.length === 0) {
      setStockLengths(
        uniqueParts.map((p) => ({
          part_no: p.part_no,
          finish: p.finish,
          length1: 240, // Default stock length
          length2: 0,
          qty1: 1000,
          qty2: 0,
        }))
      );
    }

    // Move to stock lengths tab after upload
    setActiveTab("stockLengths");
  };

  const handleOptimize = async () => {
    if (parts.length === 0) {
      alert("Please upload or add parts first");
      return;
    }

    if (!findOptimalLength && stockLengths.length === 0) {
      alert("Please add stock lengths or enable automatic optimization");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parts,
          stockLengths,
          bladeWidth,
          findOptimalLength,
          minLength,
          maxLength,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Optimization failed");
      }

      const optimizationResults = await response.json();

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

  const handleSaveToDropbox = async () => {
    if (!results) {
      alert("No results to save");
      return;
    }

    try {
      const response = await fetch("/api/dropbox", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: "/Optimization Results.xlsx",
          data: {
            summary: results.summary,
            stockLengthsNeeded: results.stockLengthsNeeded,
            cutPatterns: results.cutPattern.map((pattern) => ({
              stockLength: pattern.stockLength,
              stockId: pattern.stockId,
              remainingLength: pattern.remainingLength,
              cuts: pattern.cuts.map((cut) => ({
                partNo: cut.part_no,
                length: cut.length,
                mark: cut.mark,
                finish: cut.finish,
                fab: cut.fab,
              })),
            })),
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save to Dropbox");
      }

      alert("Results saved to Dropbox successfully");
    } catch (error) {
      console.error("Dropbox save error:", error);
      alert(
        `Error: ${
          error instanceof Error ? error.message : "Failed to save to Dropbox"
        }`
      );
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Extrusion Optimization</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="parts">Parts</TabsTrigger>
          <TabsTrigger value="stockLengths">Stock Lengths</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="results" disabled={!results}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parts">
          <Card>
            <CardHeader>
              <CardTitle>Parts Data</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadExcel onUpload={handlePartsUpload} />
              <div className="mt-4">
                <PartsTable parts={parts} onPartsChange={setParts} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stockLengths">
          <Card>
            <CardHeader>
              <CardTitle>Stock Lengths</CardTitle>
            </CardHeader>
            <CardContent>
              <StockLengthsTable
                stockLengths={stockLengths}
                onStockLengthsChange={setStockLengths}
                disabled={findOptimalLength}
              />
              <div className="mt-4 flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="findOptimalLength"
                  checked={findOptimalLength}
                  onChange={(e) => setFindOptimalLength(e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="findOptimalLength">
                  Automatically find optimal stock length
                </label>
              </div>
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
                    step="0.01"
                    min="0"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Material lost during each cut
                  </p>
                </div>

                {findOptimalLength && (
                  <>
                    <div>
                      <label className="block text-sm font-medium">
                        Minimum Stock Length
                      </label>
                      <input
                        type="number"
                        value={minLength}
                        onChange={(e) =>
                          setMinLength(parseFloat(e.target.value))
                        }
                        step="1"
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium">
                        Maximum Stock Length
                      </label>
                      <input
                        type="number"
                        value={maxLength}
                        onChange={(e) =>
                          setMaxLength(parseFloat(e.target.value))
                        }
                        step="1"
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
            <OptimizationResults
              results={results}
              onSaveToDropbox={handleSaveToDropbox}
            />
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
