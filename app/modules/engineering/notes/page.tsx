// app/engineering/notes/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Project,
  NoteCategoryWithNotes,
  EngineeringNoteWithStatuses,
  NoteStatus,
  CreateNoteCategoryForm,
  CreateEngineeringNoteForm,
  UpdateEngineeringNoteForm,
  ChecklistSummary,
} from "../../../types";
import { NoteCategoryContainer } from "../../../components/engineering/NoteCategoryContainer";
import { StatusManagement } from "../../../components/engineering/StatusManagement";
import { EngineeringNoteEditDialog } from "../../../components/engineering/EngineeringNoteEditDialog";

export default function EngineeringNotesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [categories, setCategories] = useState<NoteCategoryWithNotes[]>([]);
  const [statuses, setStatuses] = useState<NoteStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [checklistSummaries, setChecklistSummaries] = useState<
    Record<number, ChecklistSummary | null>
  >({});
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingNote, setEditingNote] =
    useState<EngineeringNoteWithStatuses | null>(null);
  const [draggedNote, setDraggedNote] =
    useState<EngineeringNoteWithStatuses | null>(null);
  const [draggedCategory, setDraggedCategory] =
    useState<NoteCategoryWithNotes | null>(null);

  // Fetch active projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch categories and statuses when project changes
  useEffect(() => {
    if (selectedProjectId) {
      fetchCategories(selectedProjectId);
      fetchStatuses(selectedProjectId);
    } else {
      setCategories([]);
      setStatuses([]);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/engineering/notes");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchStatuses = async (projectId: number) => {
    try {
      const res = await fetch(
        `/api/engineering/notes/statuses?projectId=${projectId}`
      );
      if (!res.ok) throw new Error("Failed to fetch statuses");
      const data = await res.json();
      setStatuses(data.statuses || []);
    } catch (error) {
      console.error("Error fetching statuses:", error);
      setStatuses([]);
    }
  };

  const fetchCategories = async (
    projectId: number,
    shouldRefreshSummaries = false
  ) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/engineering/notes?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      const newCategories = data.categories || [];
      setCategories(newCategories);

      // Only fetch summaries if explicitly requested or if we don't have them yet
      if (
        shouldRefreshSummaries ||
        Object.keys(checklistSummaries).length === 0
      ) {
        const allNoteIds = newCategories.flatMap((cat: any) =>
          cat.notes.map((note: any) => note.id)
        );

        if (allNoteIds.length > 0) {
          await fetchChecklistSummaries(allNoteIds);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchChecklistSummaries = async (noteIds: number[]) => {
    try {
      // Fetch summaries for all notes in parallel
      const summaryPromises = noteIds.map(async (noteId) => {
        try {
          const res = await fetch(
            `/api/engineering/notes/checklists/summary/${noteId}`
          );
          if (!res.ok) return { noteId, summary: null };
          const data = await res.json();
          return { noteId, summary: data.summary };
        } catch (error) {
          console.error(`Error fetching summary for note ${noteId}:`, error);
          return { noteId, summary: null };
        }
      });

      const results = await Promise.all(summaryPromises);

      // Convert to object format for easy lookup
      const summariesMap: Record<number, ChecklistSummary | null> = {};
      results.forEach(({ noteId, summary }) => {
        summariesMap[noteId] = summary;
      });

      setChecklistSummaries((prev) => ({ ...prev, ...summariesMap }));
    } catch (error) {
      console.error("Error fetching checklist summaries:", error);
    }
  };

  // Helper function to update local state immediately for cross-category moves
  const updateLocalStateForCrossMove = (
    movedNote: EngineeringNoteWithStatuses,
    targetCategoryId: number,
    dropIndex: number
  ) => {
    setCategories((prev) => {
      const newCategories = prev.map((cat) => {
        // Remove note from source category
        if (cat.id === movedNote.categoryId) {
          return {
            ...cat,
            notes: cat.notes.filter((note) => note.id !== movedNote.id),
          };
        }

        // Add note to target category at correct position
        if (cat.id === targetCategoryId) {
          const newNotes = [...cat.notes];
          const updatedNote = { ...movedNote, categoryId: targetCategoryId };

          // Insert at the correct position
          if (dropIndex >= newNotes.length) {
            newNotes.push(updatedNote);
          } else {
            newNotes.splice(dropIndex, 0, updatedNote);
          }

          return { ...cat, notes: newNotes };
        }

        return cat;
      });

      return newCategories;
    });
  };

  // Helper function to revert local state if API call fails
  const revertToServerState = () => {
    if (selectedProjectId !== null) {
      fetchCategories(selectedProjectId, false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !selectedProjectId) return;

    try {
      const categoryData: CreateNoteCategoryForm = {
        projectId: selectedProjectId,
        name: newCategoryName.trim(),
      };

      const res = await fetch("/api/engineering/notes/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });

      if (!res.ok) throw new Error("Failed to create category");

      const data = await res.json();
      const newCategory: NoteCategoryWithNotes = {
        ...data.category,
        notes: [],
      };

      setCategories((prev) => [...prev, newCategory]);
      setNewCategoryName("");
      setIsAddingCategory(false);
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const handleEditCategory = async (categoryId: number, name: string) => {
    try {
      const res = await fetch(
        `/api/engineering/notes/categories/${categoryId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        }
      );

      if (!res.ok) throw new Error("Failed to update category");

      setCategories((prev) =>
        prev.map((cat) => (cat.id === categoryId ? { ...cat, name } : cat))
      );
    } catch (error) {
      console.error("Error updating category:", error);
    }
  };

  const handleDeleteCategory = async (categoryId: number) => {
    try {
      const res = await fetch(
        `/api/engineering/notes/categories/${categoryId}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to delete category");

      setCategories((prev) => prev.filter((cat) => cat.id !== categoryId));
    } catch (error) {
      console.error("Error deleting category:", error);
    }
  };

  const handleAddNote = async (data: CreateEngineeringNoteForm) => {
    try {
      const res = await fetch("/api/engineering/notes/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to create note");

      const response = await res.json();
      const newNote = response.note;

      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === data.categoryId
            ? { ...cat, notes: [...cat.notes, newNote] }
            : cat
        )
      );
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleEditNote = (note: EngineeringNoteWithStatuses) => {
    setEditingNote(note);
  };

  const handleSaveNote = async (
    noteId: number,
    updates: UpdateEngineeringNoteForm
  ) => {
    try {
      const res = await fetch(`/api/engineering/notes/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error("Failed to update note");

      // Refresh the categories to get updated note with statuses
      if (selectedProjectId) {
        fetchCategories(selectedProjectId);
      }

      setEditingNote(null);
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;

    try {
      const res = await fetch(`/api/engineering/notes/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete note");

      setCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          notes: cat.notes.filter((note) => note.id !== noteId),
        }))
      );
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Add handlers for status badge management
  const handleStatusAdd = async (noteId: number, statusId: number) => {
    try {
      console.log("Adding status:", { noteId, statusId });
      const res = await fetch("/api/engineering/notes/status-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, statusId }),
      });

      if (!res.ok) throw new Error("Failed to add status");

      // Refresh categories to show updated status badges
      if (selectedProjectId) {
        fetchCategories(selectedProjectId);
      }
    } catch (error) {
      console.error("Error adding status:", error);
    }
  };

  const handleStatusRemove = async (noteId: number, statusId: number) => {
    try {
      const res = await fetch("/api/engineering/notes/status-assignments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noteId, statusId }),
      });

      if (!res.ok) throw new Error("Failed to remove status");

      // Refresh categories to show updated status badges
      if (selectedProjectId) {
        fetchCategories(selectedProjectId);
      }
    } catch (error) {
      console.error("Error removing status:", error);
    }
  };

  // Drag and drop handlers for notes
  const handleNoteDragStart = (
    e: React.DragEvent,
    note: EngineeringNoteWithStatuses
  ) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleNoteDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Add this new function for reordering notes within the same category
  const handleNoteReorder = async (
    categoryId: number,
    sourceIndex: number,
    targetIndex: number
  ) => {
    if (sourceIndex === targetIndex) return;

    try {
      // Find the category and reorder its notes
      const category = categories.find((cat) => cat.id === categoryId);
      if (!category) return;

      const newNotes = [...category.notes];
      const [movedNote] = newNotes.splice(sourceIndex, 1);
      newNotes.splice(targetIndex, 0, movedNote);

      // Update local state immediately
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === categoryId ? { ...cat, notes: newNotes } : cat
        )
      );

      // Send reorder request to server
      const orderedNoteIds = newNotes.map((note) => note.id);
      await fetch("/api/engineering/notes/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          orderedNoteIds,
        }),
      });
    } catch (error) {
      console.error("Error reordering notes:", error);
      // Revert on error
      if (selectedProjectId) {
        fetchCategories(selectedProjectId);
      }
    }
  };

  // Update the handleNoteDrop function with simpler logic
  const handleNoteDrop = async (
    e: React.DragEvent,
    targetCategoryId: number,
    dropIndex?: number
  ) => {
    e.preventDefault();

    if (!draggedNote) {
      setDraggedNote(null);
      return;
    }

    // If dropping in the same category, handle reordering
    if (draggedNote.categoryId === targetCategoryId) {
      const category = categories.find((cat) => cat.id === targetCategoryId);
      if (!category) return;

      const sourceIndex = category.notes.findIndex(
        (note) => note.id === draggedNote.id
      );

      // Adjust drop index for same-category moves
      let targetIndex;
      if (dropIndex !== undefined) {
        // If dropping after the source position, adjust for the removal of the source card
        targetIndex = dropIndex > sourceIndex ? dropIndex - 1 : dropIndex;
      } else {
        targetIndex = sourceIndex;
      }

      console.log("Drop debug:", {
        dropIndex,
        sourceIndex,
        targetIndex,
        adjusted: dropIndex !== undefined && dropIndex > sourceIndex,
      });

      if (sourceIndex !== targetIndex) {
        await handleNoteReorder(targetCategoryId, sourceIndex, targetIndex);
      }

      setDraggedNote(null);
      return;
    }

    // If dropping in a different category, handle moving
    if (draggedNote.categoryId !== targetCategoryId) {
      console.log("Cross-category move:", {
        dropIndex,
        from: draggedNote.categoryId,
        to: targetCategoryId,
      });

      // Update local state immediately for instant visual feedback
      if (dropIndex !== undefined) {
        updateLocalStateForCrossMove(draggedNote, targetCategoryId, dropIndex);
      }

      try {
        const moveData: any = { categoryId: targetCategoryId };

        const res = await fetch(
          `/api/engineering/notes/notes/${draggedNote.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(moveData),
          }
        );

        if (!res.ok) throw new Error("Failed to move note");

        // If we didn't do optimistic positioning, refresh normally
        if (dropIndex === undefined && selectedProjectId !== null) {
          fetchCategories(selectedProjectId, false);
        }
        // If we did optimistic positioning, the UI is already updated!
      } catch (error) {
        console.error("Error moving note:", error);
        // Revert to server state on error
        revertToServerState();
      } finally {
        setDraggedNote(null);
      }
      return;
    }
  };

  // Drag and drop handlers for categories
  const handleCategoryDragStart = (
    e: React.DragEvent,
    category: NoteCategoryWithNotes
  ) => {
    setDraggedCategory(category);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleCategoryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleCategoryDrop = async (
    e: React.DragEvent,
    targetIndex: number
  ) => {
    e.preventDefault();

    if (!draggedCategory) return;

    const currentIndex = categories.findIndex(
      (cat) => cat.id === draggedCategory.id
    );
    if (currentIndex === targetIndex) {
      setDraggedCategory(null);
      return;
    }

    // Reorder categories locally
    const newCategories = [...categories];
    const [movedCategory] = newCategories.splice(currentIndex, 1);
    newCategories.splice(targetIndex, 0, movedCategory);
    setCategories(newCategories);

    try {
      // Update order on server
      const orderedCategoryIds = newCategories.map((cat) => cat.id);
      await fetch("/api/engineering/notes/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          orderedCategoryIds,
        }),
      });
    } catch (error) {
      console.error("Error reordering categories:", error);
      // Revert on error
      if (selectedProjectId) {
        fetchCategories(selectedProjectId);
      }
    } finally {
      setDraggedCategory(null);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Engineering Notes</h1>

        {/* Project Selection */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="project-select">Project:</Label>
            <Select
              value={selectedProjectId?.toString() || ""}
              onValueChange={(value) => setSelectedProjectId(parseInt(value))}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects
                  .filter((project) => project.id !== undefined)
                  .map((project) => (
                    <SelectItem key={project.id} value={project.id!.toString()}>
                      {project.name}{" "}
                      {project.jobNumber && `(${project.jobNumber})`}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProjectId && (
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsAddingCategory(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </Button>

              <StatusManagement
                projectId={selectedProjectId}
                statuses={statuses}
                onStatusesChange={setStatuses}
              />
            </div>
          )}
        </div>

        {/* Add Category Form */}
        {isAddingCategory && (
          <div className="flex gap-2 mb-4 p-4 border rounded-lg bg-gray-50">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Category name (e.g., DA, Shop Drawings, Takeoffs)"
              className="flex-1"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddCategory();
                } else if (e.key === "Escape") {
                  setIsAddingCategory(false);
                  setNewCategoryName("");
                }
              }}
            />
            <Button
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
            >
              Add
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategoryName("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      {!selectedProjectId ? (
        <div className="text-center text-gray-500 py-12">
          <p>Select a project to view and manage engineering notes.</p>
        </div>
      ) : loading ? (
        <div className="text-center text-gray-500 py-12">
          <p>Loading categories...</p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {categories.length === 0 ? (
            <div className="text-center text-gray-500 py-12 w-full">
              <p>No categories yet for {selectedProject?.name}.</p>
              <p className="text-sm">Click "Add Category" to get started.</p>
            </div>
          ) : (
            categories.map((category, index) => (
              <div
                key={category.id}
                draggable
                onDragStart={(e) => handleCategoryDragStart(e, category)}
                onDragOver={handleCategoryDragOver}
                onDrop={(e) => handleCategoryDrop(e, index)}
                className={cn(
                  draggedCategory?.id === category.id && "opacity-50"
                )}
              >
                <NoteCategoryContainer
                  category={category}
                  isDragging={draggedCategory?.id === category.id}
                  draggedNoteId={draggedNote?.id || null}
                  availableStatuses={statuses}
                  checklistSummaries={checklistSummaries}
                  onAddNote={handleAddNote}
                  onEditNote={handleEditNote}
                  onDeleteNote={handleDeleteNote}
                  onEditCategory={handleEditCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onNoteDragStart={handleNoteDragStart}
                  onNoteDragOver={handleNoteDragOver}
                  onNoteDrop={handleNoteDrop}
                  onStatusAdd={handleStatusAdd} // Add this line
                  onStatusRemove={handleStatusRemove} // Add this line
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Note Dialog */}
      <EngineeringNoteEditDialog
        note={editingNote}
        categories={categories}
        statuses={statuses}
        isOpen={!!editingNote}
        onClose={() => setEditingNote(null)}
        onSave={handleSaveNote}
      />
    </div>
  );
}
