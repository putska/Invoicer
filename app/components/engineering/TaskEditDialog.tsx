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

export function TaskEditDialog({
  task,
  isOpen,
  onClose,
  onSave,
}: TaskEditDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateTaskForm>({});

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
