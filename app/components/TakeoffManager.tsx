"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Calculator,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import type {
  BIMModel,
  BIMElement,
  MaterialTakeoff,
  TakeoffItem,
} from "@/app/types";

interface TakeoffManagerProps {
  model: BIMModel;
  selectedElement?: BIMElement;
  onElementAdd?: (element: BIMElement) => void;
}

interface NewTakeoffItem {
  elementId?: number;
  materialType: string;
  materialName: string;
  unit: string;
  quantity: number;
  unitCost: number;
  category: string;
  supplier?: string;
  notes?: string;
}

export default function TakeoffManager({
  model,
  selectedElement,
  onElementAdd,
}: TakeoffManagerProps) {
  const [takeoffs, setTakeoffs] = useState<MaterialTakeoff[]>([]);
  const [currentTakeoff, setCurrentTakeoff] = useState<MaterialTakeoff | null>(
    null
  );
  const [takeoffItems, setTakeoffItems] = useState<TakeoffItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewTakeoffDialog, setShowNewTakeoffDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);

  // New takeoff form state
  const [newTakeoffName, setNewTakeoffName] = useState("");
  const [newTakeoffDescription, setNewTakeoffDescription] = useState("");

  // New item form state
  const [newItem, setNewItem] = useState<NewTakeoffItem>({
    materialType: "",
    materialName: "",
    unit: "LF",
    quantity: 0,
    unitCost: 0,
    category: "Framing",
  });

  // Load takeoffs for the model
  useEffect(() => {
    loadTakeoffs();
  }, [model.id]);

  // Pre-fill form when element is selected
  useEffect(() => {
    if (selectedElement && showAddItemDialog) {
      setNewItem((prev) => ({
        ...prev,
        elementId: selectedElement.id,
        materialType: selectedElement.material || "",
        materialName: `${selectedElement.elementType} - ${selectedElement.elementName}`,
        category: getCategoryFromElementType(selectedElement.elementType || ""),
        // Pre-fill quantity from geometry data if available
        quantity: extractQuantityFromElement(selectedElement),
        unit: getUnitFromElementType(selectedElement.elementType || ""),
      }));
    }
  }, [selectedElement, showAddItemDialog]);

  const loadTakeoffs = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/bim/models/${model.id}/takeoffs`);
      if (response.ok) {
        const result = await response.json();
        setTakeoffs(result.data || []);
      }
    } catch (error) {
      console.error("Error loading takeoffs:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTakeoffItems = async (takeoffId: number) => {
    try {
      const response = await fetch(`/api/bim/takeoffs/${takeoffId}`);
      if (response.ok) {
        const result = await response.json();
        setTakeoffItems(result.data?.items || []);
        setCurrentTakeoff(result.data?.takeoff);
      }
    } catch (error) {
      console.error("Error loading takeoff items:", error);
    }
  };

  const createNewTakeoff = async () => {
    if (!newTakeoffName.trim()) return;

    try {
      const response = await fetch("/api/bim/takeoffs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modelId: model.id,
          takeoffName: newTakeoffName,
          description: newTakeoffDescription,
          rules: [], // Empty rules for manual takeoff
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setTakeoffs((prev) => [result.data.takeoff, ...prev]);
        setCurrentTakeoff(result.data.takeoff);
        setTakeoffItems([]);
        setShowNewTakeoffDialog(false);
        setNewTakeoffName("");
        setNewTakeoffDescription("");
      }
    } catch (error) {
      console.error("Error creating takeoff:", error);
    }
  };

  const addItemToTakeoff = async () => {
    if (!currentTakeoff || !newItem.materialName.trim()) return;

    const totalCost = newItem.quantity * newItem.unitCost;

    // TODO: Replace with actual API call
    // const mockItem: TakeoffItem = {
    //   id: Math.random(),
    //   takeoffId: currentTakeoff.id,
    //   elementId: newItem.elementId,
    //   materialType: newItem.materialType,
    //   materialName: newItem.materialName,
    //   unit: newItem.unit,
    //   quantity: newItem.quantity,
    //   unitCost: newItem.unitCost,
    //   totalCost: totalCost,
    //   category: newItem.category,
    //   supplier: newItem.supplier,
    //   notes: newItem.notes,
    // };

    //setTakeoffItems((prev) => [...prev, mockItem]);
    setShowAddItemDialog(false);
    resetNewItemForm();

    // Notify parent that element was added
    if (selectedElement) {
      onElementAdd?.(selectedElement);
    }
  };

  const resetNewItemForm = () => {
    setNewItem({
      materialType: "",
      materialName: "",
      unit: "LF",
      quantity: 0,
      unitCost: 0,
      category: "Framing",
    });
  };

  const getCategoryFromElementType = (elementType: string): string => {
    const categoryMap: { [key: string]: string } = {
      Mullion: "Framing",
      Glazing: "Glazing",
      Seal: "Sealing",
      Panel: "Panels",
      Hardware: "Hardware",
    };
    return categoryMap[elementType] || "Other";
  };

  const getUnitFromElementType = (elementType: string): string => {
    const unitMap: { [key: string]: string } = {
      Mullion: "LF",
      Glazing: "SF",
      Seal: "LF",
      Panel: "SF",
      Hardware: "EA",
    };
    return unitMap[elementType] || "EA";
  };

  const extractQuantityFromElement = (element: BIMElement): number => {
    // Extract quantity from geometry data based on element type
    if (element.geometryData && typeof element.geometryData === "object") {
      const geometryData = element.geometryData as any;

      if (element.elementType === "Mullion" && geometryData.length) {
        return geometryData.length;
      }
      if (element.elementType === "Glazing" && geometryData.area) {
        return geometryData.area;
      }
    }
    return 1; // Default quantity
  };

  const calculateTakeoffSummary = () => {
    const totalCost = takeoffItems.reduce(
      (sum, item) => sum + Number(item.totalCost || 0),
      0
    );
    const totalItems = takeoffItems.length;

    const categoryTotals = takeoffItems.reduce((acc, item) => {
      const category = item.category || "Other";
      acc[category] = (acc[category] || 0) + Number(item.totalCost || 0);
      return acc;
    }, {} as Record<string, number>);

    return { totalCost, totalItems, categoryTotals };
  };

  const exportTakeoff = async () => {
    if (!currentTakeoff) return;

    // TODO: Implement export functionality
    console.log("Exporting takeoff:", currentTakeoff.id);

    // For now, create a simple CSV export
    const csvContent = generateCSVContent();
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `takeoff_${currentTakeoff.takeoffName.replace(
      /\s+/g,
      "_"
    )}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateCSVContent = (): string => {
    const headers = [
      "Item",
      "Category",
      "Material",
      "Quantity",
      "Unit",
      "Unit Cost",
      "Total Cost",
      "Supplier",
      "Notes",
    ];
    const rows = takeoffItems.map((item) => [
      item.materialName || "",
      item.category || "",
      item.materialType || "",
      item.quantity || 0,
      item.unit || "",
      item.unitCost || 0,
      item.totalCost || 0,
      item.supplier || "",
      item.notes || "",
    ]);

    return [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
  };

  const summary = calculateTakeoffSummary();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-xl font-bold">Material Takeoffs</h2>
          <p className="text-sm text-muted-foreground">{model.name}</p>
        </div>
        <Button onClick={() => setShowNewTakeoffDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Takeoff
        </Button>
      </div>

      <div className="flex-1 flex">
        {/* Takeoff List Sidebar */}
        <div className="w-80 border-r bg-muted/30">
          <div className="p-4">
            <h3 className="font-semibold mb-3">Takeoffs</h3>
            <div className="space-y-2">
              {takeoffs.map((takeoff) => (
                <Card
                  key={takeoff.id}
                  className={`cursor-pointer transition-colors ${
                    currentTakeoff?.id === takeoff.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => loadTakeoffItems(takeoff.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {takeoff.takeoffName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {takeoff.status === "draft" && (
                            <Badge variant="secondary">Draft</Badge>
                          )}
                          {takeoff.status === "approved" && (
                            <Badge variant="default">Approved</Badge>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          ${(takeoff.totalCost || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {takeoffs.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No takeoffs yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Takeoff Content */}
        <div className="flex-1 flex flex-col">
          {currentTakeoff ? (
            <>
              {/* Takeoff Header */}
              <div className="p-4 border-b bg-background">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {currentTakeoff.takeoffName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {currentTakeoff.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setShowAddItemDialog(true)}
                      disabled={!selectedElement}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportTakeoff}>
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="p-4 border-b bg-muted/20">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold">
                        {summary.totalItems}
                      </div>
                      <div className="text-sm text-muted-foreground">Items</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold">
                        ${summary.totalCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Cost
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-2xl font-bold">
                        {Object.keys(summary.categoryTotals).length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Categories
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-auto p-4">
                <div className="space-y-2">
                  {takeoffItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{item.category}</Badge>
                              <h4 className="font-medium">
                                {item.materialName}
                              </h4>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground">
                              <div>
                                <span className="font-medium">Quantity:</span>{" "}
                                {item.quantity} {item.unit}
                              </div>
                              <div>
                                <span className="font-medium">Unit Cost:</span>{" "}
                                ${item.unitCost}
                              </div>
                              <div>
                                <span className="font-medium">Total:</span> $
                                {(item.totalCost || 0).toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium">Supplier:</span>{" "}
                                {item.supplier || "TBD"}
                              </div>
                            </div>
                            {item.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {takeoffItems.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No items in this takeoff yet</p>
                      <p className="text-sm">
                        Select elements in the 3D viewer to add them
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a takeoff to view details</p>
                <p className="text-sm">
                  Or create a new takeoff to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Takeoff Dialog */}
      <Dialog
        open={showNewTakeoffDialog}
        onOpenChange={setShowNewTakeoffDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Takeoff</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="takeoffName">Takeoff Name</Label>
              <Input
                id="takeoffName"
                value={newTakeoffName}
                onChange={(e) => setNewTakeoffName(e.target.value)}
                placeholder="e.g., Curtain Wall - Building A"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newTakeoffDescription}
                onChange={(e) => setNewTakeoffDescription(e.target.value)}
                placeholder="Optional description..."
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createNewTakeoff} className="flex-1">
                Create Takeoff
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowNewTakeoffDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onOpenChange={setShowAddItemDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Takeoff Item</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="materialName">Item Name</Label>
              <Input
                id="materialName"
                value={newItem.materialName}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    materialName: e.target.value,
                  }))
                }
                placeholder="Material or component name"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={newItem.category}
                onValueChange={(value) =>
                  setNewItem((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Framing">Framing</SelectItem>
                  <SelectItem value="Glazing">Glazing</SelectItem>
                  <SelectItem value="Sealing">Sealing</SelectItem>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Panels">Panels</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    quantity: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={newItem.unit}
                onValueChange={(value) =>
                  setNewItem((prev) => ({ ...prev, unit: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LF">Linear Feet (LF)</SelectItem>
                  <SelectItem value="SF">Square Feet (SF)</SelectItem>
                  <SelectItem value="EA">Each (EA)</SelectItem>
                  <SelectItem value="LB">Pounds (LB)</SelectItem>
                  <SelectItem value="HR">Hours (HR)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="unitCost">Unit Cost ($)</Label>
              <Input
                id="unitCost"
                type="number"
                step="0.01"
                value={newItem.unitCost}
                onChange={(e) =>
                  setNewItem((prev) => ({
                    ...prev,
                    unitCost: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={newItem.supplier || ""}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, supplier: e.target.value }))
                }
                placeholder="Optional supplier name"
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={newItem.notes || ""}
                onChange={(e) =>
                  setNewItem((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder="Optional notes..."
                rows={3}
              />
            </div>
            <div className="col-span-2">
              <div className="bg-muted p-3 rounded">
                <div className="text-sm font-medium">
                  Total Cost: $
                  {(newItem.quantity * newItem.unitCost).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={addItemToTakeoff} className="flex-1">
              Add Item
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowAddItemDialog(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
