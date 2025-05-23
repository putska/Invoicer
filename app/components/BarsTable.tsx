// Updated BarsTable.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash } from "lucide-react";
import { Bar } from "../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BarsTableProps {
  bars: Bar[];
  onBarsChange: (bars: Bar[]) => void;
  disabled?: boolean;
  parts?: Array<{ id: number; partNo: string }>; // Available part numbers
  findOptimalBarByPart?: boolean; // Flag to indicate if optimal bar is found per part
}

export default function BarsTable({
  bars,
  onBarsChange,
  disabled = false,
  parts = [],
  findOptimalBarByPart = false,
}: BarsTableProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newBar, setNewBar] = useState<Partial<Bar>>({
    length: 0,
    qty: 1000,
    partNo: "",
    description: "",
  });

  // Get unique part numbers from parts
  const uniquePartNos = Array.from(new Set(parts.map((p) => p.partNo)))
    .filter((partNo) => partNo !== undefined && partNo !== null) // Remove null/undefined values
    .map((partNo) => String(partNo)) // Convert all values to strings
    .sort((a, b) => a.localeCompare(b));

  // When "Automatically find optimal bar length" is checked
  if (disabled) {
    // If "for each part number" is also checked
    if (findOptimalBarByPart) {
      return (
        <div className="rounded-md border bg-blue-50 p-6 text-center text-blue-700">
          <p>
            Optimal bar lengths will be automatically calculated for each part
            number.
          </p>
          <p className="text-sm mt-2">
            Disable automatic optimization in settings to manually define bar
            lengths.
          </p>
        </div>
      );
    } else {
      // Just regular automatic optimization
      return (
        <div className="rounded-md border bg-gray-50 p-6 text-center text-gray-500">
          <p>Automatic bar optimization is enabled.</p>
          <p className="text-sm mt-2">
            Disable it in settings to manually define bar lengths.
          </p>
        </div>
      );
    }
  }

  const handleAddBar = () => {
    // Basic validation
    if (!newBar.length) {
      alert("Bar length is required");
      return;
    }

    const id = bars.length > 0 ? Math.max(...bars.map((b) => b.id)) + 1 : 1;
    const fullBar: Bar = {
      id,
      length: newBar.length,
      qty: newBar.qty || 1000,
      partNo: newBar.partNo || undefined,
      description: newBar.description || undefined,
    };

    onBarsChange([...bars, fullBar]);

    // Reset the form
    setNewBar({
      length: 0,
      qty: 1000,
      partNo: "",
      description: "",
    });
  };

  const handleDeleteBar = (id: number) => {
    onBarsChange(bars.filter((bar) => bar.id !== id));
  };

  const handleEditBar = (id: number) => {
    setEditingId(id);
  };

  const handleUpdateBar = (id: number, field: keyof Bar, value: any) => {
    const updatedBars = bars.map((bar) => {
      if (bar.id === id) {
        return { ...bar, [field]: value };
      }
      return bar;
    });
    onBarsChange(updatedBars);
  };

  const handleSaveEdit = () => {
    setEditingId(null);
  };

  const addStandardBars = () => {
    // Add common bar lengths
    const standardLengths = [120, 144, 192, 240, 288, 360, 480];

    // Filter out lengths that already exist
    const existingLengths = new Set(bars.map((b) => b.length));
    const newLengths = standardLengths.filter(
      (length) => !existingLengths.has(length)
    );

    if (newLengths.length === 0) {
      alert("All standard bar lengths are already added");
      return;
    }

    // Create new bars with these lengths
    const nextId = bars.length > 0 ? Math.max(...bars.map((b) => b.id)) + 1 : 1;
    const newBars = newLengths.map((length, index) => ({
      id: nextId + index,
      length,
      qty: 100,
      partNo: undefined,
      description: `Standard ${length}" bar`,
    }));

    onBarsChange([...bars, ...newBars]);
  };

  // Helper function to get display text for quantity
  const getQuantityDisplayText = (bar: Bar) => {
    if (bar.partNo) {
      return `${bar.qty}`;
    } else {
      return `${bar.qty} each`;
    }
  };

  // Helper function to get the effective total quantity for a bar
  const getEffectiveTotalQuantity = (bar: Bar) => {
    if (bar.partNo) {
      // Specific part number - quantity is as entered
      return bar.qty;
    } else {
      // No part number specified - quantity applies to each part
      return bar.qty * uniquePartNos.length;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium">Add New Bar</h3>
          <Button variant="outline" size="sm" onClick={addStandardBars}>
            Add Standard Bars
          </Button>
        </div>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <Label htmlFor="length">Length (inches)</Label>
            <Input
              id="length"
              type="number"
              step={12}
              value={newBar.length || ""}
              onChange={(e) =>
                setNewBar({ ...newBar, length: parseFloat(e.target.value) })
              }
              placeholder="Length"
            />
          </div>
          <div>
            <Label htmlFor="qty">
              Quantity Available{" "}
              {!newBar.partNo && uniquePartNos.length > 0 && (
                <span className="text-xs text-gray-500">(per part)</span>
              )}
            </Label>
            <Input
              id="qty"
              type="number"
              min="1"
              step="1"
              value={newBar.qty || 1000}
              onChange={(e) =>
                setNewBar({ ...newBar, qty: parseInt(e.target.value, 10) })
              }
              placeholder="Quantity"
            />
            {!newBar.partNo && uniquePartNos.length > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Total: {(newBar.qty || 1000) * uniquePartNos.length} bars
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="partNo">Part Number (Optional)</Label>
            {uniquePartNos.length > 0 ? (
              <Select
                value={newBar.partNo || ""}
                onValueChange={(value) =>
                  setNewBar({
                    ...newBar,
                    partNo: value === "__ANY__" ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any part number" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__ANY__">Any part number</SelectItem>
                  {uniquePartNos.map((partNo) => (
                    <SelectItem key={partNo} value={partNo}>
                      {partNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="partNo"
                value={newBar.partNo || ""}
                onChange={(e) =>
                  setNewBar({ ...newBar, partNo: e.target.value || undefined })
                }
                placeholder="Part Number (optional)"
              />
            )}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={newBar.description || ""}
              onChange={(e) =>
                setNewBar({
                  ...newBar,
                  description: e.target.value || undefined,
                })
              }
              placeholder="Description (optional)"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleAddBar} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Bar
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Length (inches)</TableHead>
              <TableHead>Quantity Available</TableHead>
              <TableHead>Part Number</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bars.map((bar) => (
              <TableRow key={bar.id}>
                <TableCell>
                  {editingId === bar.id ? (
                    <Input
                      type="number"
                      step={12}
                      value={bar.length}
                      onChange={(e) =>
                        handleUpdateBar(
                          bar.id,
                          "length",
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  ) : (
                    bar.length
                  )}
                </TableCell>
                <TableCell>
                  {editingId === bar.id ? (
                    <div>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={bar.qty}
                        onChange={(e) =>
                          handleUpdateBar(
                            bar.id,
                            "qty",
                            parseInt(e.target.value, 10)
                          )
                        }
                      />
                      {!bar.partNo && uniquePartNos.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          Total: {bar.qty * uniquePartNos.length} bars
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div>{getQuantityDisplayText(bar)}</div>
                      {!bar.partNo && uniquePartNos.length > 0 && (
                        <div className="text-xs text-gray-500">
                          (Total: {getEffectiveTotalQuantity(bar)})
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === bar.id ? (
                    uniquePartNos.length > 0 ? (
                      <Select
                        value={bar.partNo || ""}
                        onValueChange={(value) =>
                          handleUpdateBar(
                            bar.id,
                            "partNo",
                            value === "__ANY__" ? undefined : value
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any part number" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__ANY__">
                            Any part number
                          </SelectItem>
                          {uniquePartNos.map((partNo) => (
                            <SelectItem key={partNo} value={partNo}>
                              {partNo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={bar.partNo || ""}
                        onChange={(e) =>
                          handleUpdateBar(
                            bar.id,
                            "partNo",
                            e.target.value || undefined
                          )
                        }
                      />
                    )
                  ) : (
                    bar.partNo || "-"
                  )}
                </TableCell>
                <TableCell>
                  {editingId === bar.id ? (
                    <Input
                      value={bar.description || ""}
                      onChange={(e) =>
                        handleUpdateBar(
                          bar.id,
                          "description",
                          e.target.value || undefined
                        )
                      }
                    />
                  ) : (
                    bar.description || "-"
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    {editingId === bar.id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveEdit}
                      >
                        Save
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBar(bar.id)}
                      >
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteBar(bar.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {bars.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-4 text-gray-500"
                >
                  No bars added yet. Add bars above or use "Add Standard Bars".
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
