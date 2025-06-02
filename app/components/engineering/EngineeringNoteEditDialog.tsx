// components/engineering/EngineeringNoteEditDialog.tsx
"use client";

import { useState, useEffect } from "react";

// Temporary types (normally imported)
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

interface EngineeringNoteWithStatuses {
  id: number;
  categoryId: number;
  title: string;
  content: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  statuses: NoteStatus[];
}

interface NoteCategory {
  id: number;
  projectId: number;
  name: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface UpdateEngineeringNoteForm {
  title?: string;
  content?: string;
  categoryId?: number;
  sortOrder?: number;
  statusIds?: number[];
}
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "./RichTextEditor";

interface EngineeringNoteEditDialogProps {
  note: EngineeringNoteWithStatuses | null;
  categories: NoteCategory[];
  statuses: NoteStatus[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteId: number, updates: UpdateEngineeringNoteForm) => Promise<void>;
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

export function EngineeringNoteEditDialog({
  note,
  categories,
  statuses,
  isOpen,
  onClose,
  onSave,
}: EngineeringNoteEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateEngineeringNoteForm>({});
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [newChecklistName, setNewChecklistName] = useState("");
  const [draggedItem, setDraggedItem] = useState<{
    checklistId: number;
    itemId: number;
  } | null>(null);
  const [loadingChecklists, setLoadingChecklists] = useState(false);

  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title,
        content: note.content || "",
        categoryId: note.categoryId,
        // Remove statusIds from here since we manage statuses on the card
      });
    }
  }, [note]);

  // Reset isSaving when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setIsSaving(false);
    }
  }, [isOpen]);

  // Fetch checklists from API when dialog opens or note changes
  useEffect(() => {
    if (note && isOpen) {
      setLoadingChecklists(true);
      fetch(`/api/engineering/notes/checklists?noteId=${note.id}`)
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
    } else {
      setChecklists([]);
    }
  }, [note, isOpen]);

  // Add checklist via API
  const handleAddChecklist = async () => {
    if (!newChecklistName.trim() || !note) return;
    const res = await fetch("/api/engineering/notes/checklists", {
      method: "POST",
      body: JSON.stringify({ noteId: note.id, name: newChecklistName }),
      headers: { "Content-Type": "application/json" },
    });
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
    const res = await fetch("/api/engineering/notes/checklist-items", {
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
      `/api/engineering/notes/checklist-items/${itemId}`,
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
    await fetch(`/api/engineering/notes/checklist-items/${itemId}`, {
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
    await fetch(`/api/engineering/notes/checklists/${checklistId}`, {
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
    setChecklists((prev) =>
      prev.map((c) => (c.id === checklistId ? { ...c, items } : c))
    );
    setDraggedItem({ checklistId, itemId: overItemId });
  };

  const handleDrop = async () => {
    if (!draggedItem) return;
    const cl = checklists.find((c) => c.id === draggedItem.checklistId);
    if (!cl) return;
    await fetch("/api/engineering/notes/checklist-items", {
      method: "PUT",
      body: JSON.stringify({
        checklistId: cl.id,
        orderedItemIds: cl.items.map((i) => i.id),
      }),
      headers: { "Content-Type": "application/json" },
    });
    setDraggedItem(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!note) return;

    setIsSaving(true);
    try {
      await onSave(note.id, formData);
    } catch (error) {
      console.error("Failed to save note:", error);
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

  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>
            Make changes to the note details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-title">Note Title</Label>
            <Input
              id="edit-title"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="edit-content">Content</Label>
            <RichTextEditor
              value={formData.content || ""}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Enter your notes here..."
            />
          </div>

          <div>
            <Label htmlFor="edit-category">Category</Label>
            <Select
              value={
                formData.categoryId?.toString() || note.categoryId.toString()
              }
              onValueChange={(value) =>
                setFormData({ ...formData, categoryId: parseInt(value) })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

// ChecklistItems subcomponent (reusing from your existing structure)
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
