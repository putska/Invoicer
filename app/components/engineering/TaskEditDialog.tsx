// components/engineering/TaskEditDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { TaskWithAssignment, UpdateTaskForm } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskEditDialogProps {
  task: TaskWithAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: number, updates: UpdateTaskForm) => Promise<void>;
}

type ChecklistItem = {
  id: number;
  text: string;
  checked: boolean;
  sortOrder: number;
};
type Checklist = {
  id: number;
  name: string;
  sortOrder: number;
  items: ChecklistItem[];
};

export function TaskEditDialog({
  task,
  isOpen,
  onClose,
  onSave,
}: TaskEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateTaskForm>({});
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [newChecklistName, setNewChecklistName] = useState("");
  const [draggedItem, setDraggedItem] = useState<{
    checklistId: number;
    itemId: number;
  } | null>(null);
  const [loadingChecklists, setLoadingChecklists] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name,
        notes: task.notes || "",
        durationDays: task.durationDays,
        dueDate: task.dueDate,
        status: task.status,
        isLastMinute: task.isLastMinute,
      });
    }
  }, [task]);

  // Reset isSaving when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false);
    }
  }, [isOpen]);

  // Fetch checklists from API when dialog opens or task changes
  useEffect(() => {
    if (task && isOpen) {
      setLoadingChecklists(true);
      fetch(`/api/engineering/tasks/checklists?taskId=${task.id}`)
        .then(async (res) => {
          // Prevent JSON parse error on empty or invalid response
          if (!res.ok) throw new Error("Failed to fetch checklists");
          const text = await res.text();
          if (!text) return { checklists: [] };
          try {
            return JSON.parse(text);
          } catch {
            return { checklists: [] };
          }
        })
        .then((data) => setChecklists(data.checklists || []))
        .catch(() => setChecklists([]))
        .finally(() => setLoadingChecklists(false));
    } else {
      setChecklists([]);
    }
  }, [task, isOpen]);

  // Add checklist via API
  const handleAddChecklist = async () => {
    if (!newChecklistName.trim() || !task) return;
    const res = await fetch("/api/engineering/tasks/checklists", {
      method: "POST",
      body: JSON.stringify({ taskId: task.id, name: newChecklistName }),
      headers: { "Content-Type": "application/json" },
    });
    // Prevent JSON parse error on empty or invalid response
    const text = await res.text();
    let checklist = null;
    if (text) {
      try {
        const data = JSON.parse(text);
        checklist = data.checklist;
      } catch {
        checklist = null;
      }
    }
    if (checklist) {
      setChecklists((prev) => [...prev, { ...checklist, items: [] }]);
    }
    setNewChecklistName("");
  };

  // Add checklist item via API
  const handleAddChecklistItem = async (checklistId: number, text: string) => {
    const res = await fetch("/api/engineering/tasks/checklist-items", {
      method: "POST",
      body: JSON.stringify({ checklistId, text }),
      headers: { "Content-Type": "application/json" },
    });
    const { item } = await res.json();
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId ? { ...cl, items: [...cl.items, item] } : cl
      )
    );
  };

  // Toggle checklist item checked via API
  const handleToggleChecklistItem = async (
    checklistId: number,
    itemId: number
  ) => {
    const checklist = checklists.find((cl) => cl.id === checklistId);
    const item = checklist?.items.find((i) => i.id === itemId);
    if (!item) return;
    const res = await fetch(
      `/api/engineering/tasks/checklist-items/${itemId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ checked: !item.checked }),
        headers: { "Content-Type": "application/json" },
      }
    );
    const { item: updated } = await res.json();
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? {
              ...cl,
              items: cl.items.map((i) => (i.id === itemId ? updated : i)),
            }
          : cl
      )
    );
  };

  // Delete checklist item via API
  const handleDeleteChecklistItem = async (
    checklistId: number,
    itemId: number
  ) => {
    await fetch(`/api/engineering/tasks/checklist-items/${itemId}`, {
      method: "DELETE",
    });
    setChecklists((prev) =>
      prev.map((cl) =>
        cl.id === checklistId
          ? { ...cl, items: cl.items.filter((item) => item.id !== itemId) }
          : cl
      )
    );
  };

  // Delete checklist via API
  const handleDeleteChecklist = async (checklistId: number) => {
    await fetch(`/api/engineering/tasks/checklists/${checklistId}`, {
      method: "DELETE",
    });
    setChecklists((prev) => prev.filter((cl) => cl.id !== checklistId));
  };

  // Drag and drop for checklist items (reorder via API)
  const handleDragStart = (checklistId: number, itemId: number) =>
    setDraggedItem({ checklistId, itemId });

  const handleDragOver = (
    e: React.DragEvent,
    checklistId: number,
    overItemId: number
  ) => {
    e.preventDefault();
    if (
      !draggedItem ||
      draggedItem.checklistId !== checklistId ||
      draggedItem.itemId === overItemId
    )
      return;
    const cl = checklists.find((c) => c.id === checklistId);
    if (!cl) return;
    const items = [...cl.items];
    const fromIdx = items.findIndex((i) => i.id === draggedItem.itemId);
    const toIdx = items.findIndex((i) => i.id === overItemId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = items.splice(fromIdx, 1);
    items.splice(toIdx, 0, moved);
    // Update order locally
    setChecklists((prev) =>
      prev.map((c) => (c.id === checklistId ? { ...c, items } : c))
    );
    setDraggedItem({ checklistId, itemId: overItemId });
  };

  const handleDrop = async () => {
    if (!draggedItem) return;
    const cl = checklists.find((c) => c.id === draggedItem.checklistId);
    if (!cl) return;
    // Persist new order to API
    await fetch("/api/engineering/tasks/checklist-items", {
      method: "PUT",
      body: JSON.stringify({
        checklistId: cl.id,
        orderedItemIds: cl.items.map((i) => i.id),
      }),
      headers: { "Content-Type": "application/json" },
    });
    setDraggedItem(null);
    // Optionally, refetch checklists to ensure order is synced with DB:
    setLoadingChecklists(true);
    fetch(`/api/engineering/tasks/checklists?taskId=${task?.id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch checklists");
        const text = await res.text();
        if (!text) return { checklists: [] };
        try {
          return JSON.parse(text);
        } catch {
          return { checklists: [] };
        }
      })
      .then((data) => setChecklists(data.checklists || []))
      .catch(() => setChecklists([]))
      .finally(() => setLoadingChecklists(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!task) return;

    setIsSaving(true);
    try {
      await onSave(task.id, formData);
      // Don't close here, let the parent handle it
    } catch (error) {
      console.error("Failed to save task:", error);
      setIsSaving(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSaving) {
      onClose();
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to the task details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Task Name</Label>
            <Input
              id="edit-name"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="Describe what is required"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-duration">Duration (days)</Label>
              <Input
                id="edit-duration"
                type="number"
                min="1"
                value={formData.durationDays || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    durationDays: parseInt(e.target.value),
                  })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-due-date">Due Date</Label>
              <Input
                id="edit-due-date"
                type="date"
                value={formData.dueDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-status">Status</Label>
            <Select
              value={formData.status || task.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="edit-is-last-minute"
              checked={formData.isLastMinute || false}
              onChange={(e) =>
                setFormData({ ...formData, isLastMinute: e.target.checked })
              }
              className="rounded"
            />
            <Label
              htmlFor="edit-is-last-minute"
              className="font-normal cursor-pointer"
            >
              Last minute addition
            </Label>
          </div>

          {/* Checklist Section */}
          <div>
            <Label>Checklists</Label>
            <div className="flex gap-2 mt-2">
              <Input
                value={newChecklistName}
                onChange={(e) => setNewChecklistName(e.target.value)}
                placeholder="Checklist name"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddChecklist}
                disabled={!newChecklistName.trim()}
              >
                Add Checklist
              </Button>
            </div>
            <div className="space-y-4 mt-2">
              {loadingChecklists ? (
                <div>Loading checklists...</div>
              ) : (
                checklists.map((cl) => (
                  <div key={cl.id} className="border rounded p-2 bg-gray-50">
                    <div className="font-semibold mb-2 flex items-center gap-2">
                      <span>{cl.name}</span>
                      <span className="ml-auto text-xs bg-green-100 text-green-800 rounded px-2 py-0.5 flex items-center gap-1">
                        <span>
                          {cl.items.filter((i) => i.checked).length}/
                          {cl.items.length}
                        </span>
                        <span className="inline-block w-4 h-4 border border-green-400 rounded bg-white flex items-center justify-center">
                          {cl.items.length > 0 &&
                            cl.items.every((i) => i.checked) && (
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M3 6.5L5.5 9L9 4.5"
                                  stroke="#22c55e"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                        </span>
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-red-500 ml-2"
                        title="Delete Checklist"
                        onClick={() => handleDeleteChecklist(cl.id)}
                      >
                        ×
                      </Button>
                    </div>
                    <ChecklistItems
                      checklist={cl}
                      onAddItem={handleAddChecklistItem}
                      onToggleItem={handleToggleChecklistItem}
                      onDeleteItem={handleDeleteChecklistItem}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      draggedItem={draggedItem}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ChecklistItems subcomponent
function ChecklistItems({
  checklist,
  onAddItem,
  onToggleItem,
  onDeleteItem,
  onDragStart,
  onDragOver,
  onDrop,
  draggedItem,
}: {
  checklist: Checklist;
  onAddItem: (checklistId: number, text: string) => void;
  onToggleItem: (checklistId: number, itemId: number) => void;
  onDeleteItem: (checklistId: number, itemId: number) => void;
  onDragStart: (checklistId: number, itemId: number) => void;
  onDragOver: (
    e: React.DragEvent,
    checklistId: number,
    overItemId: number
  ) => void;
  onDrop: () => void;
  draggedItem: { checklistId: number; itemId: number } | null;
}) {
  const [newItem, setNewItem] = useState("");
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Add item"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newItem.trim()) {
              onAddItem(checklist.id, newItem.trim());
              setNewItem("");
            }
          }}
        />
        <Button
          type="button"
          onClick={() => {
            if (newItem.trim()) {
              onAddItem(checklist.id, newItem.trim());
              setNewItem("");
            }
          }}
          disabled={!newItem.trim()}
        >
          Add
        </Button>
      </div>
      <div>
        {checklist.items.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-2 bg-white rounded shadow-sm px-2 py-1 mb-1 border ${
              draggedItem &&
              draggedItem.checklistId === checklist.id &&
              draggedItem.itemId === item.id
                ? "opacity-50"
                : ""
            }`}
            draggable
            onDragStart={() => onDragStart(checklist.id, item.id)}
            onDragOver={(e) => onDragOver(e, checklist.id, item.id)}
            onDrop={onDrop}
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => onToggleItem(checklist.id, item.id)}
              className="rounded"
            />
            <span
              className={`flex-1 text-sm ${
                item.checked ? "line-through text-gray-400" : ""
              }`}
            >
              {item.text}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => onDeleteItem(checklist.id, item.id)}
              className="text-red-500"
              title="Delete"
            >
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
