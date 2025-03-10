// components/SheetSummary.tsx
import React from "react";
import { CutSheet } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SheetSummaryProps {
  sheets: CutSheet[];
}

// Helper function to convert square inches to square feet
const sqInToSqFt = (sqIn: number): number => sqIn / 144;

export default function SheetSummary({ sheets }: SheetSummaryProps) {
  // Group sheets by size
  const sheetsBySize = sheets.reduce(
    (groups, sheet) => {
      const sizeKey = `${sheet.width} x ${sheet.height}`;

      if (!groups[sizeKey]) {
        groups[sizeKey] = {
          width: sheet.width,
          height: sheet.height,
          count: 0,
          totalAreaSqFt: 0,
          usedAreaSqFt: 0,
          // Track the sheet IDs for reference
          sheetIds: new Set<number>(),
        };
      }

      groups[sizeKey].count += 1;
      groups[sizeKey].totalAreaSqFt += sqInToSqFt(sheet.width * sheet.height);
      groups[sizeKey].usedAreaSqFt += sqInToSqFt(sheet.usedArea);
      groups[sizeKey].sheetIds.add(sheet.sheetId);

      return groups;
    },
    {} as Record<
      string,
      {
        width: number;
        height: number;
        count: number;
        totalAreaSqFt: number;
        usedAreaSqFt: number;
        sheetIds: Set<number>;
      }
    >
  );

  // Convert to array for rendering
  const sheetGroups = Object.entries(sheetsBySize).map(([sizeKey, data]) => {
    return {
      sizeKey,
      ...data,
      yield: (data.usedAreaSqFt / data.totalAreaSqFt) * 100,
      sheetIds: Array.from(data.sheetIds),
    };
  });

  // Sort by size (largest first)
  sheetGroups.sort((a, b) => b.width * b.height - a.width * a.height);

  // Calculate overall totals
  const overallTotals = sheetGroups.reduce(
    (totals, group) => {
      return {
        sheetCount: totals.sheetCount + group.count,
        totalAreaSqFt: totals.totalAreaSqFt + group.totalAreaSqFt,
        usedAreaSqFt: totals.usedAreaSqFt + group.usedAreaSqFt,
      };
    },
    { sheetCount: 0, totalAreaSqFt: 0, usedAreaSqFt: 0 }
  );

  // Calculate overall yield
  const overallYield =
    (overallTotals.usedAreaSqFt / overallTotals.totalAreaSqFt) * 100;

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Sheet Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border border-gray-300 text-left">
                  Sheet Size
                </th>
                <th className="px-4 py-2 border border-gray-300 text-center">
                  Quantity
                </th>
                <th className="px-4 py-2 border border-gray-300 text-center">
                  Sheet ID(s)
                </th>
                <th className="px-4 py-2 border border-gray-300 text-right">
                  Total Area (sq.ft)
                </th>
                <th className="px-4 py-2 border border-gray-300 text-right">
                  Used Area (sq.ft)
                </th>
                <th className="px-4 py-2 border border-gray-300 text-right">
                  Yield %
                </th>
              </tr>
            </thead>
            <tbody>
              {sheetGroups.map((group) => (
                <tr key={group.sizeKey} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border border-gray-300">
                    {group.width}" × {group.height}"
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-center">
                    {group.count}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-center">
                    {group.sheetIds.join(", ")}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-right">
                    {group.totalAreaSqFt.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-right">
                    {group.usedAreaSqFt.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 border border-gray-300 text-right">
                    {group.yield.toFixed(2)}%
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-4 py-2 border border-gray-300">TOTALS</td>
                <td className="px-4 py-2 border border-gray-300 text-center">
                  {overallTotals.sheetCount}
                </td>
                <td className="px-4 py-2 border border-gray-300 text-center">
                  -
                </td>
                <td className="px-4 py-2 border border-gray-300 text-right">
                  {overallTotals.totalAreaSqFt.toFixed(2)}
                </td>
                <td className="px-4 py-2 border border-gray-300 text-right">
                  {overallTotals.usedAreaSqFt.toFixed(2)}
                </td>
                <td className="px-4 py-2 border border-gray-300 text-right">
                  {overallYield.toFixed(2)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
