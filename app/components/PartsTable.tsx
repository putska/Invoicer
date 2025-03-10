// components/PartsTable.tsx
"use client";

import React, { useState } from "react";
import { Part } from "../types";
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

interface PartsTableProps {
  parts: Part[];
  onPartsChange: (parts: Part[]) => void;
}

export default function PartsTable({ parts, onPartsChange }: PartsTableProps) {
  const [newPart, setNewPart] = useState<Partial<Part>>({
    qty: 1,
    partNo: "",
    length: 0,
    markNo: "",
    finish: "",
    fab: "",
  });

  const handleAddPart = () => {
    if (!newPart.partNo || (newPart.length ?? 0) <= 0) {
      alert("Please enter a part number and valid length");
      return;
    }

    onPartsChange([
      ...parts,
      {
        ...newPart,
        id: newPart.id ?? 0,
        userId: newPart.userId ?? "",
        createdAt: newPart.createdAt ?? new Date(),
      } as Part,
    ]);

    // Reset form except for part_no and finish to make adding multiple similar parts easier
    setNewPart({
      ...newPart,
      qty: 1,
      length: 0,
      markNo: "",
      fab: "",
    });
  };

  const handleDeletePart = (index: number) => {
    const updatedParts = [...parts];
    updatedParts.splice(index, 1);
    onPartsChange(updatedParts);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setNewPart({
      ...newPart,
      [name]: type === "number" ? (value ? parseFloat(value) : 0) : value,
    });
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>QTY</TableHead>
                <TableHead>Part No</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Mark No</TableHead>
                <TableHead>Finish</TableHead>
                <TableHead>Fab</TableHead>
                <TableHead className="w-[60px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((part, index) => (
                <TableRow key={index}>
                  <TableCell>{part.qty}</TableCell>
                  <TableCell>{part.partNo}</TableCell>
                  <TableCell>{part.length}</TableCell>
                  <TableCell>{part.markNo}</TableCell>
                  <TableCell>{part.finish}</TableCell>
                  <TableCell>{part.fab}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePart(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Add new part form */}
              <TableRow>
                <TableCell>
                  <input
                    type="number"
                    name="qty"
                    value={newPart.qty}
                    onChange={handleInputChange}
                    min="1"
                    className="w-16 p-1 border rounded"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    name="part_no"
                    value={newPart.partNo}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="number"
                    name="length"
                    value={newPart.length || ""}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-24 p-1 border rounded"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    name="mark_no"
                    value={newPart.markNo}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    name="finish"
                    value={newPart.finish}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    name="fab"
                    value={newPart.fab}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded"
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={handleAddPart}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>

              {parts.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-4 text-gray-500"
                  >
                    No parts added yet. Add parts above or upload from Excel.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
