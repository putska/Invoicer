// components/engineering/ArchivedTasksView.tsx
"use client";

import { useState } from "react";
import { TaskWithAssignment } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Archive, RotateCcw, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ArchivedTasksViewProps {
  tasks: TaskWithAssignment[];
  onRestoreTask: (taskId: number) => Promise<void>;
}

export function ArchivedTasksView({
  tasks,
  onRestoreTask,
}: ArchivedTasksViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [restoringTaskId, setRestoringTaskId] = useState<number | null>(null);

  const handleRestore = async (taskId: number) => {
    setRestoringTaskId(taskId);
    try {
      await onRestoreTask(taskId);
    } catch (error) {
      console.error("Failed to restore task:", error);
    } finally {
      setRestoringTaskId(null);
    }
  };

  // Group tasks by project
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectName = task.project.name;
    if (!acc[projectName]) {
      acc[projectName] = [];
    }
    acc[projectName].push(task);
    return acc;
  }, {} as Record<string, TaskWithAssignment[]>);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Archive className="h-4 w-4" />
        View Archived ({tasks.length})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Archived Tasks</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {Object.keys(tasksByProject).length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No archived tasks
              </p>
            ) : (
              Object.entries(tasksByProject).map(
                ([projectName, projectTasks]) => (
                  <div key={projectName}>
                    <h3 className="font-semibold text-sm text-gray-700 mb-2">
                      {projectName}
                    </h3>
                    <div className="space-y-2">
                      {projectTasks.map((task) => (
                        <Card key={task.id} className="bg-gray-50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium">{task.name}</h4>
                                {task.notes && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {task.notes}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{task.durationDays} days</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      Due{" "}
                                      {format(
                                        new Date(task.dueDate),
                                        "MMM d, yyyy"
                                      )}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  {task.isLastMinute && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      Last minute
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    Archived{" "}
                                    {format(new Date(task.updatedAt), "MMM d")}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRestore(task.id)}
                                disabled={restoringTaskId === task.id}
                                className="ml-4"
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                {restoringTaskId === task.id
                                  ? "Restoring..."
                                  : "Restore"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
