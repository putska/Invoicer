// components/StockLengthsTable.tsx
"use client";

import React from "react";
import { ExtListItem } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface StockLengthsTableProps {
  stockLengths: ExtListItem[];
  onStockLengthsChange: (stockLengths: ExtListItem[]) => void;
  disabled?: boolean;
}

export default function StockLengthsTable({
  stockLengths,
  onStockLengthsChange,
  disabled = false,
}: StockLengthsTableProps) {
  const handleInputChange = (
    index: number,
    field: keyof ExtListItem,
    value: string | number
  ) => {
    const updatedStockLengths = [...stockLengths];

    // Handle numeric fields
    if (
      field === "length1" ||
      field === "length2" ||
      field === "qty1" ||
      field === "qty2"
    ) {
      updatedStockLengths[index][field] =
        typeof value === "string" ? parseFloat(value) || 0 : value;
    } else {
      // Handle string fields
      updatedStockLengths[index][field] = value.toString();
    }

    onStockLengthsChange(updatedStockLengths);
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part No</TableHead>
                <TableHead>Finish</TableHead>
                <TableHead>Primary Length</TableHead>
                <TableHead>Primary Qty</TableHead>
                <TableHead>Secondary Length</TableHead>
                <TableHead>Secondary Qty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockLengths.map((stockLength, index) => (
                <TableRow key={index}>
                  <TableCell>{stockLength.part_no}</TableCell>
                  <TableCell>{stockLength.finish}</TableCell>
                  <TableCell>
                    <input
                      type="number"
                      value={stockLength.length1 || ""}
                      onChange={(e) =>
                        handleInputChange(index, "length1", e.target.value)
                      }
                      step="0.01"
                      min="0"
                      className="w-24 p-1 border rounded"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      value={stockLength.qty1 || ""}
                      onChange={(e) =>
                        handleInputChange(index, "qty1", e.target.value)
                      }
                      min="0"
                      className="w-16 p-1 border rounded"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      value={stockLength.length2 || ""}
                      onChange={(e) =>
                        handleInputChange(index, "length2", e.target.value)
                      }
                      step="0.01"
                      min="0"
                      className="w-24 p-1 border rounded"
                      disabled={disabled}
                    />
                  </TableCell>
                  <TableCell>
                    <input
                      type="number"
                      value={stockLength.qty2 || ""}
                      onChange={(e) =>
                        handleInputChange(index, "qty2", e.target.value)
                      }
                      min="0"
                      className="w-16 p-1 border rounded"
                      disabled={disabled}
                    />
                  </TableCell>
                </TableRow>
              ))}

              {stockLengths.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-4 text-gray-500"
                  >
                    {disabled
                      ? "Stock lengths will be automatically determined"
                      : "No stock lengths defined. Please add parts first."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {disabled && stockLengths.length > 0 && (
          <div className="p-4 bg-yellow-50 text-yellow-800 text-sm">
            <p>
              Auto-optimization is enabled. Stock lengths will be determined
              automatically.
            </p>
            <p>Disable auto-optimization to manually set stock lengths.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
