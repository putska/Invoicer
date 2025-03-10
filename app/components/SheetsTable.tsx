// components/SheetsTable.tsx
"use client";

import React, { useState } from "react";
import { Sheet } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Trash2 } from "lucide-react";

interface SheetsTableProps {
  sheets: Sheet[];
  onSheetsChange: (sheets: Sheet[]) => void;
  disabled?: boolean;
}

const COMMON_SHEET_SIZES = [
  { width: 96, height: 50, name: "8' x 4'-2''" },
  { width: 120, height: 50, name: "10' x 4'-2''" },
  { width: 120, height: 62, name: "10' x 5'-2''" },
  { width: 144, height: 62, name: "12' x 5'-2''" },
];

export default function SheetsTable({
  sheets,
  onSheetsChange,
  disabled = false,
}: SheetsTableProps) {
  const [newSheet, setNewSheet] = useState<Sheet>({
    id: 0,
    width: 96,
    height: 48,
    qty: 1000,
  });

  const handleAddSheet = () => {
    if (!newSheet.width || !newSheet.height) {
      alert("Please enter sheet width and height");
      return;
    }

    // Generate a temporary id if needed
    const tempId = -(sheets.length + 1);

    onSheetsChange([
      ...sheets,
      {
        ...newSheet,
        id: newSheet.id || tempId,
      },
    ]);

    // Reset form to defaults
    setNewSheet({
      id: 0,
      width: 96,
      height: 48,
      qty: 1000,
    });
  };

  const handleDeleteSheet = (index: number) => {
    const updatedSheets = [...sheets];
    updatedSheets.splice(index, 1);
    onSheetsChange(updatedSheets);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setNewSheet({
      ...newSheet,
      [name]: type === "number" ? (value ? parseFloat(value) : 0) : value,
    });
  };

  const handleAddCommonSize = (width: number, height: number) => {
    // Check if this size already exists
    const exists = sheets.some(
      (sheet) => sheet.width === width && sheet.height === height
    );

    if (!exists) {
      // Generate a temporary id if needed
      const tempId = -(sheets.length + 1);

      onSheetsChange([
        ...sheets,
        {
          id: tempId,
          width,
          height,
          qty: 1000,
        },
      ]);
    }
  };

  return (
    <div>
      {!disabled && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Common Sheet Sizes:</h3>
          <div className="flex flex-wrap gap-2">
            {COMMON_SHEET_SIZES.map((size, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleAddCommonSize(size.width, size.height)}
              >
                {size.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Width (in)</TableHead>
                  <TableHead>Height (in)</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sheets.map((sheet, index) => (
                  <TableRow key={sheet.id || index}>
                    <TableCell>{sheet.width}"</TableCell>
                    <TableCell>{sheet.height}"</TableCell>
                    <TableCell>{sheet.qty}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSheet(index)}
                        disabled={disabled}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {!disabled && (
                  <TableRow>
                    <TableCell>
                      <input
                        type="number"
                        name="width"
                        value={newSheet.width || ""}
                        onChange={handleInputChange}
                        step="0.125"
                        min="0"
                        className="w-20 p-1 border rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        name="height"
                        value={newSheet.height || ""}
                        onChange={handleInputChange}
                        step="0.125"
                        min="0"
                        className="w-20 p-1 border rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        type="number"
                        name="qty"
                        value={newSheet.qty || ""}
                        onChange={handleInputChange}
                        min="1"
                        className="w-16 p-1 border rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddSheet}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )}

                {sheets.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center py-4 text-gray-500"
                    >
                      {disabled
                        ? "Sheet sizes will be automatically determined"
                        : "No sheet sizes defined. Add sheets using the form above."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {disabled && sheets.length > 0 && (
            <div className="p-4 bg-yellow-50 text-yellow-800 text-sm">
              <p>
                Auto-optimization is enabled. Sheet sizes will be determined
                automatically.
              </p>
              <p>Disable auto-optimization to manually set sheet sizes.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
