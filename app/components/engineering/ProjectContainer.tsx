// components/engineering/ProjectContainer.tsx
"use client";

import { useState } from "react";
import { Project, TaskWithAssignment, CreateTaskForm } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TaskCard } from "./TaskCard";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ProjectContainerProps {
  project: Project;
  tasks: TaskWithAssignment[];
  onCreateTask: (task: CreateTaskForm) => Promise<void>;
  onArchiveTask?: (taskId: number) => void;
  onEditTask?: (task: TaskWithAssignment) => void;
}

export function ProjectContainer({
  project,
  tasks,
  onCreateTask,
  onArchiveTask,
  onEditTask,
}: ProjectContainerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);

    const formData = new FormData(e.currentTarget);
    const task: CreateTaskForm = {
      projectId: project.id!,
      name: formData.get("name") as string,
      notes: (formData.get("notes") as string) || undefined,
      durationDays: parseInt(formData.get("duration") as string),
      dueDate: formData.get("dueDate") as string,
      isLastMinute: formData.get("isLastMinute") === "on",
    };

    try {
      await onCreateTask(task);
      setIsCreateOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-lg font-semibold">
              {project.name}
            </CardTitle>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-7">
                <Plus className="h-3 w-3 mr-1" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <Label htmlFor="name">Task Name</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    placeholder="Enter task name"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Describe what is required"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      required
                      defaultValue="1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      required
                      min={format(new Date(), "yyyy-MM-dd")}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isLastMinute"
                    name="isLastMinute"
                    className="rounded"
                  />
                  <Label
                    htmlFor="isLastMinute"
                    className="font-normal cursor-pointer"
                  >
                    Last minute addition
                  </Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Task"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {tasks.length} task{tasks.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <Droppable droppableId={`project-${project.id}`}>
        {(provided, snapshot) => (
          <CardContent
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[150px] p-3",
              snapshot.isDraggingOver && "bg-blue-50/50"
            )}
          >
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400 text-sm">
                <p>No tasks yet</p>
                <p className="text-xs">Click "Add Task" to create one</p>
              </div>
            ) : (
              <div className="space-y-0">
                {tasks.map((task, index) => (
                  <Draggable
                    key={task.id}
                    draggableId={`task-${task.id}`}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={provided.draggableProps.style}
                      >
                        <TaskCard
                          task={task}
                          index={index}
                          isDragging={snapshot.isDragging}
                          onArchive={onArchiveTask}
                          onEdit={onEditTask}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
              </div>
            )}
            {provided.placeholder}
          </CardContent>
        )}
      </Droppable>
    </Card>
  );
}
