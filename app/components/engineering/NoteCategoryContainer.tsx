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
  EngineeringNoteWithStatuses,
  CreateEngineeringNoteForm,
  ChecklistSummary,
} from "../../types";
import { EngineeringNoteCard } from "./EngineeringNoteCard";

interface NoteCategoryContainerProps {
  category: NoteCategoryWithNotes;
  isDragging?: boolean;
  draggedNoteId?: number | null;
  availableStatuses?: any[]; // Add available statuses prop
  checklistSummaries?: Record<number, ChecklistSummary | null>;
  onAddNote: (data: CreateEngineeringNoteForm) => Promise<void>;
  onEditNote: (note: EngineeringNoteWithStatuses) => void;
  onDeleteNote: (noteId: number) => Promise<void>;
  onEditCategory: (categoryId: number, name: string) => Promise<void>;
  onDeleteCategory: (categoryId: number) => Promise<void>;
  onNoteDragStart: (
    e: React.DragEvent,
    note: EngineeringNoteWithStatuses
  ) => void;
  onNoteDragOver: (e: React.DragEvent) => void;
  onNoteDrop: (
    e: React.DragEvent,
    categoryId: number,
    dropIndex?: number
  ) => void;
  onStatusAdd?: (noteId: number, statusId: number) => void; // Add status handlers
  onStatusRemove?: (noteId: number, statusId: number) => void;
}

export function NoteCategoryContainer({
  category,
  isDragging,
  draggedNoteId,
  availableStatuses = [],
  checklistSummaries = {},
  onAddNote,
  onEditNote,
  onDeleteNote,
  onEditCategory,
  onDeleteCategory,
  onNoteDragStart,
  onNoteDragOver,
  onNoteDrop,
  onStatusAdd,
  onStatusRemove,
}: NoteCategoryContainerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragOverCategory, setIsDragOverCategory] = useState(false);

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
      // statusId will be automatically set to the default project status in the backend
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

  const handleCategoryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    setIsDragOverCategory(true);

    // Only set to end position if we're not over a specific note
    // (this gets overridden by individual note drag over handlers)
    //setDragOverIndex(category.notes.length);

    onNoteDragOver(e); // Call the original handler
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear the drag state if we're leaving the category entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverIndex(null);
      setIsDragOverCategory(false);
    }
  };

  // Only hide the dragged note if we're in a different category and actively dragging over it
  const isDraggedNoteInThisCategory =
    draggedNoteId && category.notes.some((note) => note.id === draggedNoteId);
  const shouldHideDraggedNote =
    draggedNoteId && !isDraggedNoteInThisCategory && isDragOverCategory;

  const visibleNotes = shouldHideDraggedNote
    ? category.notes.filter((note) => note.id !== draggedNoteId)
    : category.notes;

  // Get the original position of the dragged note in this category
  const draggedNoteOriginalIndex = draggedNoteId
    ? category.notes.findIndex((note) => note.id === draggedNoteId)
    : -1;

  const isDraggedNoteFromThisCategory = draggedNoteOriginalIndex !== -1;

  return (
    <Card
      className={cn(
        "w-80 flex-shrink-0 bg-gray-50 border-2 transition-all duration-200",
        isDragging && "opacity-50",
        isDragOverCategory && "ring-2 ring-blue-400 ring-opacity-50 bg-blue-50" // <- ADD THIS LINE
      )}
      draggable
      onDragOver={handleCategoryDragOver}
      onDragLeave={handleDragLeave} // <- ADD THIS LINE
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();

        // Capture the drop index BEFORE clearing state
        const finalDropIndex = dragOverIndex;

        // Clear drag state
        setDragOverIndex(null);
        setIsDragOverCategory(false);

        onNoteDrop(
          e,
          category.id,
          finalDropIndex !== null ? finalDropIndex : undefined
        );
      }}
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

      {/* Always show the CardContent, but vary the content based on expanded state */}
      <CardContent className="pt-0">
        <div
          className={cn(
            "space-y-2 overflow-y-auto",
            isExpanded ? "max-h-[calc(100vh-200px)]" : "max-h-48"
          )}
        >
          {visibleNotes.length === 0 && !draggedNoteId ? (
            <div className="text-center text-gray-500 text-sm py-4">
              No notes yet. Click the + button to add one.
            </div>
          ) : visibleNotes.length === 0 && draggedNoteId ? (
            // Empty container while dragging - show drop zone
            <div className="h-20 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50 mx-2 transition-all duration-200 flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">
                Drop here
              </span>
            </div>
          ) : (
            <>
              {/* Show empty space at the beginning if dragging over index 0 */}
              {dragOverIndex === 0 &&
                draggedNoteId &&
                (!isDraggedNoteFromThisCategory ||
                  draggedNoteOriginalIndex > 0) && (
                  <div className="h-20 transition-all duration-200"></div>
                )}

              {visibleNotes.map((note, index) => {
                const actualIndex = category.notes.findIndex(
                  (n) => n.id === note.id
                );
                return (
                  <div key={note.id}>
                    <div
                      draggable
                      onDragStart={(e) => {
                        // Reset any previous drag state first
                        setDragOverIndex(null);
                        e.stopPropagation(); // Prevent category drag
                        e.dataTransfer.setData(
                          "text/plain",
                          note.id.toString()
                        );
                        onNoteDragStart(e, note);
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = "move";

                        // Calculate drop position based on mouse position within the card
                        const rect = e.currentTarget.getBoundingClientRect();
                        const mouseY = e.clientY - rect.top;
                        const cardHeight = rect.height;

                        // If hovering over top half, drop before this card; bottom half, drop after
                        const dropIndex =
                          mouseY < cardHeight / 2
                            ? actualIndex
                            : actualIndex + 1;
                        setDragOverIndex(dropIndex);
                        setIsDragOverCategory(true);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Capture the drop index BEFORE clearing state
                        const finalDropIndex = dragOverIndex;

                        // Clear drag state
                        setDragOverIndex(null);
                        setIsDragOverCategory(false);

                        onNoteDrop(
                          e,
                          category.id,
                          finalDropIndex !== null ? finalDropIndex : undefined
                        );
                      }}
                    >
                      <EngineeringNoteCard
                        note={note}
                        index={actualIndex}
                        isCollapsed={!isExpanded}
                        availableStatuses={availableStatuses}
                        checklistSummary={checklistSummaries[note.id] || null}
                        onEdit={onEditNote}
                        onDelete={onDeleteNote}
                        onStatusAdd={onStatusAdd}
                        onStatusRemove={onStatusRemove}
                      />
                    </div>

                    {/* Show empty space after this note if dragging over the next index */}
                    {dragOverIndex === actualIndex + 1 &&
                      draggedNoteId &&
                      actualIndex + 1 < category.notes.length &&
                      (!isDraggedNoteFromThisCategory ||
                        (draggedNoteOriginalIndex !== actualIndex &&
                          draggedNoteOriginalIndex !== actualIndex + 1)) && (
                        <div className="h-20 transition-all duration-200"></div>
                      )}
                  </div>
                );
              })}

              {/* Empty space at the end for dropping */}
              {visibleNotes.length > 0 && (
                <div
                  className="h-4 w-full"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverIndex(category.notes.length);
                    setIsDragOverCategory(true);
                  }}
                />
              )}

              {/* Show empty space at the end if dragging over the last position */}
              {dragOverIndex === category.notes.length &&
                draggedNoteId &&
                (!isDraggedNoteFromThisCategory ||
                  draggedNoteOriginalIndex < category.notes.length - 1) && (
                  <div className="h-20 transition-all duration-200"></div>
                )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
