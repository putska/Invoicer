// components/engineering/NoteCategoryContainer.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NoteCategoryWithNotes,
  EngineeringNote,
  CreateEngineeringNoteForm,
} from "../../types";
import { EngineeringNoteCard } from "./EngineeringNoteCard";

interface NoteCategoryContainerProps {
  category: NoteCategoryWithNotes;
  isDragging?: boolean;
  onAddNote: (data: CreateEngineeringNoteForm) => Promise<void>;
  onEditNote: (note: EngineeringNote) => void;
  onDeleteNote: (noteId: number) => Promise<void>;
  onEditCategory: (categoryId: number, name: string) => Promise<void>;
  onDeleteCategory: (categoryId: number) => Promise<void>;
  onNoteDragStart: (e: React.DragEvent, note: EngineeringNote) => void;
  onNoteDragOver: (e: React.DragEvent) => void;
  onNoteDrop: (e: React.DragEvent, categoryId: number) => void;
}

export function NoteCategoryContainer({
  category,
  isDragging,
  onAddNote,
  onEditNote,
  onDeleteNote,
  onEditCategory,
  onDeleteCategory,
  onNoteDragStart,
  onNoteDragOver,
  onNoteDrop,
}: NoteCategoryContainerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSaveEdit = async () => {
    if (editName.trim() && editName !== category.name) {
      await onEditCategory(category.id, editName.trim());
    }
    setIsEditing(false);
    setEditName(category.name);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditName(category.name);
  };

  const handleAddNote = async () => {
    if (!newNoteTitle.trim()) return;

    await onAddNote({
      categoryId: category.id,
      title: newNoteTitle.trim(),
      content: "",
      status: "draft",
    });

    setNewNoteTitle("");
    setIsAddingNote(false);
  };

  const handleEdit = () => {
    setDropdownOpen(false);
    setIsEditing(true);
  };

  const handleDelete = async () => {
    setDropdownOpen(false);
    if (
      window.confirm(
        `Are you sure you want to delete the "${category.name}" category? This will also delete all notes in this category.`
      )
    ) {
      await onDeleteCategory(category.id);
    }
  };

  return (
    <Card
      className={cn(
        "w-80 flex-shrink-0 bg-gray-50 border-2",
        isDragging && "opacity-50"
      )}
      draggable
      onDragOver={onNoteDragOver}
      onDrop={(e) => onNoteDrop(e, category.id)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
            {isEditing ? (
              <div className="flex gap-2 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 text-sm font-semibold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveEdit();
                    } else if (e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-2"
                  onClick={handleSaveEdit}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={handleCancelEdit}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <CardTitle className="text-sm font-semibold flex-1">
                {category.name}
              </CardTitle>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Collapse cards" : "Expand cards"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsAddingNote(true)}
              title="Add note"
            >
              <Plus className="h-4 w-4" />
            </Button>

            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleEdit();
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Category
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    handleDelete();
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Category
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Add Note Form */}
        {isAddingNote && (
          <div className="flex gap-2 mt-2">
            <Input
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              placeholder="Note title"
              className="flex-1 h-8 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddNote();
                } else if (e.key === "Escape") {
                  setIsAddingNote(false);
                  setNewNoteTitle("");
                }
              }}
            />
            <Button
              size="sm"
              className="h-8 px-2"
              onClick={handleAddNote}
              disabled={!newNoteTitle.trim()}
            >
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => {
                setIsAddingNote(false);
                setNewNoteTitle("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {category.notes.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-4">
                No notes yet. Click the + button to add one.
              </div>
            ) : (
              category.notes.map((note, index) => (
                <div
                  key={note.id}
                  draggable
                  onDragStart={(e) => onNoteDragStart(e, note)}
                >
                  <EngineeringNoteCard
                    note={note}
                    index={index}
                    onEdit={onEditNote}
                    onDelete={onDeleteNote}
                  />
                </div>
              ))
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
