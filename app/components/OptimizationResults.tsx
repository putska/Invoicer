// components/OptimizationResults.tsx
"use client";

import React, { useState } from "react";
import { OptimizationResult, CutPatternItem } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Download, Info } from "lucide-react";

interface OptimizationResultsProps {
  results: OptimizationResult;
  onSaveToDropbox: () => void;
}

export default function OptimizationResults({
  results,
  onSaveToDropbox,
}: OptimizationResultsProps) {
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedPattern, setSelectedPattern] = useState<CutPatternItem | null>(
    null
  );

  const handleExportCsv = () => {
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Summary section
    csvContent += "OPTIMIZATION SUMMARY\r\n";
    csvContent += `Total Stock Length,${results.summary.totalStockLength}\r\n`;
    csvContent += `Total Cut Length,${results.summary.totalCutLength}\r\n`;
    csvContent += `Waste Percentage,${results.summary.wastePercentage.toFixed(
      2
    )}%\r\n`;
    csvContent += `Total Stock Pieces,${results.summary.totalStockPieces}\r\n\r\n`;

    // Stock lengths needed
    csvContent += "STOCK LENGTHS NEEDED\r\n";
    csvContent += "Part No,Finish,Stock Length,Quantity\r\n";

    results.stockLengthsNeeded.forEach((stock) => {
      csvContent += `${stock.part_no},${stock.finish},${stock.stockLength},${stock.quantity}\r\n`;
    });

    csvContent += "\r\nCUT PATTERNS\r\n";
    csvContent +=
      "Stock ID,Stock Length,Part No,Cut Length,Mark,Finish,Fab\r\n";

    results.cutPattern.forEach((pattern) => {
      pattern.cuts.forEach((cut) => {
        csvContent += `${pattern.stockId},${pattern.stockLength},${cut.part_no},${cut.length},${cut.mark},${cut.finish},${cut.fab}\r\n`;
      });
    });

    // Create a download link and trigger it
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "optimization_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDecimal = (value: number): string => {
    return value.toFixed(2);
  };

  // Group cut patterns by part_no for easier visualization
  const patternsByPart = results.cutPattern.reduce<
    Record<string, CutPatternItem[]>
  >((acc, pattern) => {
    const partNo = pattern.cuts[0]?.part_no || "unknown";
    if (!acc[partNo]) {
      acc[partNo] = [];
    }
    acc[partNo].push(pattern);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Optimization Results</span>
            <div className="space-x-2">
              <Button size="sm" onClick={onSaveToDropbox}>
                <Save className="h-4 w-4 mr-2" />
                Save to Dropbox
              </Button>
              <Button size="sm" onClick={handleExportCsv}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="stockLengths">Stock Lengths</TabsTrigger>
              <TabsTrigger value="cutPatterns">Cut Patterns</TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">
                    Total Stock Length
                  </p>
                  <p className="text-2xl font-bold">
                    {formatDecimal(results.summary.totalStockLength)} inches
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">
                    Total Cut Length
                  </p>
                  <p className="text-2xl font-bold">
                    {formatDecimal(results.summary.totalCutLength)} inches
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">
                    Waste Percentage
                  </p>
                  <p className="text-2xl font-bold">
                    {formatDecimal(results.summary.wastePercentage)}%
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-500">
                    Total Stock Pieces
                  </p>
                  <p className="text-2xl font-bold">
                    {results.summary.totalStockPieces}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stockLengths">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part No</TableHead>
                    <TableHead>Finish</TableHead>
                    <TableHead>Stock Length</TableHead>
                    <TableHead>Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.stockLengthsNeeded.map((stock, index) => (
                    <TableRow key={index}>
                      <TableCell>{stock.part_no}</TableCell>
                      <TableCell>{stock.finish}</TableCell>
                      <TableCell>{formatDecimal(stock.stockLength)}</TableCell>
                      <TableCell>{stock.quantity}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="cutPatterns">
              <div className="mb-4">
                <h3 className="text-lg font-medium">Cut Patterns by Part</h3>
                <p className="text-sm text-gray-500">
                  Click on a stock length to see the cutting pattern detail
                </p>
              </div>

              {Object.entries(patternsByPart).map(([partNo, patterns]) => (
                <Card key={partNo} className="mb-4">
                  <CardHeader className="py-3">
                    <CardTitle className="text-md">Part: {partNo}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {patterns.map((pattern) => (
                        <Button
                          key={`${partNo}-${pattern.stockId}`}
                          variant={
                            selectedPattern?.stockId === pattern.stockId
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => setSelectedPattern(pattern)}
                        >
                          Stock #{pattern.stockId} (
                          {formatDecimal(pattern.stockLength)}")
                        </Button>
                      ))}
                    </div>

                    {selectedPattern && (
                      <div className="mt-4 p-4 border rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium">
                            Stock #{selectedPattern.stockId} (
                            {formatDecimal(selectedPattern.stockLength)}")
                          </h4>
                          <div className="text-sm">
                            Remaining:{" "}
                            {formatDecimal(selectedPattern.remainingLength)}"
                          </div>
                        </div>

                        <div className="relative h-16 bg-gray-100 rounded-lg overflow-hidden">
                          <div className="absolute inset-0 flex items-center">
                            {selectedPattern.cuts.map((cut, idx) => {
                              // Calculate position and width based on stock length
                              const totalUsed =
                                selectedPattern.stockLength -
                                selectedPattern.remainingLength;
                              let usedSoFar = 0;

                              for (let i = 0; i < idx; i++) {
                                usedSoFar += selectedPattern.cuts[i].length;
                                if (i < idx - 1) usedSoFar += 0.25; // Add blade width
                              }

                              const startPercent =
                                (usedSoFar / selectedPattern.stockLength) * 100;
                              const widthPercent =
                                (cut.length / selectedPattern.stockLength) *
                                100;

                              return (
                                <div
                                  key={idx}
                                  className="absolute h-full bg-blue-500 flex items-center justify-center text-white text-xs"
                                  style={{
                                    left: `${startPercent}%`,
                                    width: `${widthPercent}%`,
                                  }}
                                  title={`${cut.part_no} - ${cut.length}" - ${cut.mark}`}
                                >
                                  {cut.length}"
                                </div>
                              );
                            })}

                            {/* Remaining/waste area */}
                            {selectedPattern.remainingLength > 0 && (
                              <div
                                className="absolute h-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs"
                                style={{
                                  left: `${
                                    ((selectedPattern.stockLength -
                                      selectedPattern.remainingLength) /
                                      selectedPattern.stockLength) *
                                    100
                                  }%`,
                                  width: `${
                                    (selectedPattern.remainingLength /
                                      selectedPattern.stockLength) *
                                    100
                                  }%`,
                                }}
                              >
                                {formatDecimal(selectedPattern.remainingLength)}
                                " waste
                              </div>
                            )}
                          </div>
                        </div>

                        <Table className="mt-4">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Position</TableHead>
                              <TableHead>Part No</TableHead>
                              <TableHead>Length</TableHead>
                              <TableHead>Mark</TableHead>
                              <TableHead>Finish</TableHead>
                              <TableHead>Fab</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedPattern.cuts.map((cut, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>{cut.part_no}</TableCell>
                                <TableCell>
                                  {formatDecimal(cut.length)}
                                </TableCell>
                                <TableCell>{cut.mark}</TableCell>
                                <TableCell>{cut.finish}</TableCell>
                                <TableCell>{cut.fab}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
