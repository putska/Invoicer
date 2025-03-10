// components/PanelsTable.tsx
"use client";

import React, { useState } from "react";
import { Panel } from "../types";
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
import { Checkbox } from "@/components/ui/checkbox";

interface PanelsTableProps {
  panels: Panel[];
  onPanelsChange: (panels: Panel[]) => void;
}

export default function PanelsTable({
  panels,
  onPanelsChange,
}: PanelsTableProps) {
  const [newPanel, setNewPanel] = useState<Panel>({
    id: 0,
    qty: 1,
    width: 0,
    height: 0,
    mark_no: "",
    finish: "",
  });

  const handleAddPanel = () => {
    if (!newPanel.width || !newPanel.height) {
      alert("Please enter panel width and height");
      return;
    }

    // Generate a temporary id if needed
    const tempId = -(panels.length + 1);

    onPanelsChange([
      ...panels,
      {
        ...newPanel,
        id: newPanel.id || tempId,
      },
    ]);

    // Reset form except for finish to make adding similar panels easier
    setNewPanel({
      id: 0,
      qty: 1,
      width: 0,
      height: 0,
      mark_no: "",
      finish: newPanel.finish,
    });
  };

  const handleDeletePanel = (index: number) => {
    const updatedPanels = [...panels];
    updatedPanels.splice(index, 1);
    onPanelsChange(updatedPanels);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    setNewPanel({
      ...newPanel,
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
                <TableHead>Mark No</TableHead>
                <TableHead>Width (in)</TableHead>
                <TableHead>Height (in)</TableHead>
                <TableHead>Finish</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {panels.map((panel, index) => (
                <TableRow key={panel.id || index}>
                  <TableCell>{panel.qty}</TableCell>
                  <TableCell>{panel.mark_no}</TableCell>
                  <TableCell>{panel.width}</TableCell>
                  <TableCell>{panel.height}</TableCell>
                  <TableCell>{panel.finish}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeletePanel(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {/* Add new panel form */}
              <TableRow>
                <TableCell>
                  <input
                    type="number"
                    name="qty"
                    value={newPanel.qty}
                    onChange={handleInputChange}
                    min="1"
                    className="w-16 p-1 border rounded"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    name="mark_no"
                    value={newPanel.mark_no}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded"
                    placeholder="A1"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="number"
                    name="width"
                    value={newPanel.width || ""}
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
                    value={newPanel.height || ""}
                    onChange={handleInputChange}
                    step="0.125"
                    min="0"
                    className="w-20 p-1 border rounded"
                  />
                </TableCell>
                <TableCell>
                  <input
                    type="text"
                    name="finish"
                    value={newPanel.finish || ""}
                    onChange={handleInputChange}
                    className="w-full p-1 border rounded"
                    placeholder="Optional"
                  />
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={handleAddPanel}>
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>

              {panels.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-4 text-gray-500"
                  >
                    No panels added yet. Add panels above or upload from Excel.
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
