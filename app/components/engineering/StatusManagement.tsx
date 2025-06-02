// components/engineering/StatusManagement.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Settings,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  GripVertical,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Temporary types for testing - normally imported from types file
interface NoteStatus {
  id: number;
  projectId: number;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const STATUS_COLOR_OPTIONS = [
  {
    value: "blue",
    label: "Blue",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    preview: "bg-blue-500",
  },
  {
    value: "pink",
    label: "Pink",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200",
    textColor: "text-pink-800",
    preview: "bg-pink-500",
  },
  {
    value: "green",
    label: "Green",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
    preview: "bg-green-500",
  },
  {
    value: "red",
    label: "Red",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    preview: "bg-red-500",
  },
  {
    value: "yellow",
    label: "Yellow",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    textColor: "text-yellow-800",
    preview: "bg-yellow-500",
  },
  {
    value: "purple",
    label: "Purple",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    textColor: "text-purple-800",
    preview: "bg-purple-500",
  },
  {
    value: "indigo",
    label: "Indigo",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    textColor: "text-indigo-800",
    preview: "bg-indigo-500",
  },
  {
    value: "gray",
    label: "Gray",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    textColor: "text-gray-800",
    preview: "bg-gray-500",
  },
  {
    value: "orange",
    label: "Orange",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    textColor: "text-orange-800",
    preview: "bg-orange-500",
  },
  {
    value: "teal",
    label: "Teal",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    textColor: "text-teal-800",
    preview: "bg-teal-500",
  },
] as const;

interface StatusManagementProps {
  projectId: number;
  statuses: NoteStatus[];
  onStatusesChange: (statuses: NoteStatus[]) => void;
}

export function StatusManagement({
  projectId,
  statuses,
  onStatusesChange,
}: StatusManagementProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingStatus, setEditingStatus] = useState<NoteStatus | null>(null);
  const [newStatusName, setNewStatusName] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("blue");
  const [draggedStatus, setDraggedStatus] = useState<NoteStatus | null>(null);

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;

    try {
      const res = await fetch("/api/engineering/notes/statuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          name: newStatusName.trim(),
          color: newStatusColor,
        }),
      });

      if (!res.ok) throw new Error("Failed to create status");

      const data = await res.json();
      const createdStatus = data.status;

      onStatusesChange([...statuses, createdStatus]);
      setNewStatusName("");
      setNewStatusColor("blue");
      setIsAdding(false);
    } catch (error) {
      console.error("Error creating status:", error);
    }
  };

  const handleEditStatus = async (statusId: number, updates: any) => {
    try {
      const res = await fetch(`/api/engineering/notes/statuses/${statusId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const data = await res.json();
      const updatedStatus = data.status;

      onStatusesChange(
        statuses.map((status) =>
          status.id === statusId ? updatedStatus : status
        )
      );
      setEditingStatus(null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteStatus = async (statusId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this status? Notes using this status will have no status assigned."
      )
    )
      return;

    try {
      const res = await fetch(`/api/engineering/notes/statuses/${statusId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete status");

      onStatusesChange(statuses.filter((status) => status.id !== statusId));
    } catch (error) {
      console.error("Error deleting status:", error);
    }
  };

  const handleSetDefault = async (statusId: number) => {
    await handleEditStatus(statusId, { isDefault: true });
  };

  const handleReorderStatuses = async (newOrder: NoteStatus[]) => {
    try {
      const orderedStatusIds = newOrder.map((status) => status.id);

      const res = await fetch("/api/engineering/notes/statuses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          orderedStatusIds,
        }),
      });

      if (!res.ok) throw new Error("Failed to reorder statuses");

      onStatusesChange(newOrder);
    } catch (error) {
      console.error("Error reordering statuses:", error);
    }
  };

  const handleDragStart = (status: NoteStatus) => {
    setDraggedStatus(status);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (!draggedStatus) return;

    const currentIndex = statuses.findIndex((s) => s.id === draggedStatus.id);
    if (currentIndex === targetIndex) {
      setDraggedStatus(null);
      return;
    }

    const newStatuses = [...statuses];
    const [movedStatus] = newStatuses.splice(currentIndex, 1);
    newStatuses.splice(targetIndex, 0, movedStatus);

    handleReorderStatuses(newStatuses);
    setDraggedStatus(null);
  };

  const getColorPreview = (color: string) => {
    const colorConfig = STATUS_COLOR_OPTIONS.find((c) => c.value === color);
    return colorConfig?.preview || "bg-gray-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Manage Statuses
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Note Statuses</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add Status Section */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Add New Status</h3>
              {!isAdding && (
                <Button
                  onClick={() => setIsAdding(true)}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Status
                </Button>
              )}
            </div>

            {isAdding && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="status-name">Status Name</Label>
                    <Input
                      id="status-name"
                      value={newStatusName}
                      onChange={(e) => setNewStatusName(e.target.value)}
                      placeholder="e.g., On Hold, Waiting for Field Dimensions"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status-color">Color</Label>
                    <Select
                      value={newStatusColor}
                      onValueChange={setNewStatusColor}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_COLOR_OPTIONS.map((color) => (
                          <SelectItem key={color.value} value={color.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className={cn("w-4 h-4 rounded", color.preview)}
                              />
                              {color.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddStatus}
                    disabled={!newStatusName.trim()}
                    size="sm"
                  >
                    Add Status
                  </Button>
                  <Button
                    onClick={() => {
                      setIsAdding(false);
                      setNewStatusName("");
                      setNewStatusColor("blue");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <Badge
                    className={cn(
                      STATUS_COLOR_OPTIONS.find(
                        (c) => c.value === newStatusColor
                      )?.bgColor,
                      STATUS_COLOR_OPTIONS.find(
                        (c) => c.value === newStatusColor
                      )?.borderColor,
                      STATUS_COLOR_OPTIONS.find(
                        (c) => c.value === newStatusColor
                      )?.textColor,
                      "border"
                    )}
                  >
                    {newStatusName || "Status Name"}
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Existing Statuses */}
          <div>
            <h3 className="font-medium mb-3">Current Statuses</h3>
            {statuses.length === 0 ? (
              <p className="text-gray-500 text-sm">No statuses created yet.</p>
            ) : (
              <div className="space-y-2">
                {statuses.map((status, index) => (
                  <div
                    key={status.id}
                    draggable
                    onDragStart={() => handleDragStart(status)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg bg-white",
                      draggedStatus?.id === status.id && "opacity-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />

                      {editingStatus?.id === status.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editingStatus.name}
                            onChange={(e) =>
                              setEditingStatus({
                                ...editingStatus,
                                name: e.target.value,
                              })
                            }
                            className="h-8"
                          />
                          <Select
                            value={editingStatus.color}
                            onValueChange={(color) =>
                              setEditingStatus({ ...editingStatus, color })
                            }
                          >
                            <SelectTrigger className="w-32 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_COLOR_OPTIONS.map((color) => (
                                <SelectItem
                                  key={color.value}
                                  value={color.value}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={cn(
                                        "w-3 h-3 rounded",
                                        color.preview
                                      )}
                                    />
                                    {color.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleEditStatus(status.id, {
                                name: editingStatus.name,
                                color: editingStatus.color,
                              })
                            }
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingStatus(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Badge
                            className={cn(
                              status.bgColor,
                              status.borderColor,
                              status.textColor,
                              "border"
                            )}
                          >
                            {status.name}
                          </Badge>
                          {status.isDefault && (
                            <div className="flex items-center gap-1 text-xs text-yellow-600">
                              <Star className="h-3 w-3 fill-current" />
                              Default
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {editingStatus?.id !== status.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditingStatus(status)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {!status.isDefault && (
                            <DropdownMenuItem
                              onClick={() => handleSetDefault(status.id)}
                            >
                              <Star className="h-4 w-4 mr-2" />
                              Set as Default
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDeleteStatus(status.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            <p>
              <strong>Tips:</strong>
            </p>
            <ul className="mt-1 space-y-1">
              <li>• Drag statuses to reorder them</li>
              <li>
                • The default status will be automatically assigned to new notes
              </li>
              <li>
                • Deleting a status will remove it from all notes that use it
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
