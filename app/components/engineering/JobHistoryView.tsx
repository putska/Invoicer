// components/engineering/JobHistoryView.tsx
"use client";

import { useState, useEffect } from "react";
import { TaskWithAssignment, Project } from "../../types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  User,
  Archive,
  History,
  CheckCircle,
  XCircle,
  Flag,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface JobHistoryViewProps {
  projects: Project[];
}

export function JobHistoryView({ projects }: JobHistoryViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [tasks, setTasks] = useState<TaskWithAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectTasks(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjectTasks = async (projectId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/engineering/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error("Error fetching project tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "blocked":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "archived":
        return <Archive className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getTaskBgColor = (task: TaskWithAssignment) => {
    if (task.status === "archived") return "bg-gray-50 border-gray-200";
    if (task.status === "completed") return "bg-green-50 border-green-200";
    if (task.status === "blocked") return "bg-gray-100 border-gray-300";
    if (task.isOverdue) return "bg-red-50 border-red-300";
    if (task.isAtRisk) return "bg-yellow-50 border-yellow-300";
    if (task.isLastMinute) return "bg-blue-50 border-blue-300";
    return "bg-white border-gray-200";
  };

  // Sort tasks: archived first (by update date desc), then active (by created date asc)
  const sortedTasks = [...tasks].sort((a, b) => {
    // Both archived: sort by updated date descending
    if (a.status === "archived" && b.status === "archived") {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    // One archived, one not: archived comes first
    if (a.status === "archived") return -1;
    if (b.status === "archived") return 1;
    // Both not archived: sort by created date ascending
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  const selectedProject = projects.find(
    (p) => p.id !== undefined && p.id.toString() === selectedProjectId
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <History className="h-4 w-4" />
        Job History
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Job History</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a project to view history" />
                </SelectTrigger>
                <SelectContent>
                  {projects
                    .filter((project) => project.id !== undefined)
                    .map((project) => (
                      <SelectItem
                        key={project.id}
                        value={project.id!.toString()}
                      >
                        {project.name}{" "}
                        {project.jobNumber && `(${project.jobNumber})`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProject && (
              <div className="text-sm text-gray-600">
                <p>
                  Project:{" "}
                  <span className="font-medium">{selectedProject.name}</span>
                </p>
                {selectedProject.jobNumber && (
                  <p>
                    Job Number:{" "}
                    <span className="font-medium">
                      {selectedProject.jobNumber}
                    </span>
                  </p>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">Loading tasks...</p>
              </div>
            ) : selectedProjectId && sortedTasks.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">No tasks found for this project</p>
              </div>
            ) : selectedProjectId ? (
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {sortedTasks.map((task) => (
                  <Card
                    key={task.id}
                    className={cn("transition-colors", getTaskBgColor(task))}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-2 flex-1">
                          {getStatusIcon(task.status)}
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{task.name}</h4>
                            {task.notes && (
                              <p className="text-sm text-gray-600 mt-1">
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        {task.isLastMinute && (
                          <span title="Last minute addition">
                            <Flag className="h-4 w-4 text-blue-600 ml-2" />
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {task.durationDays} day
                            {task.durationDays !== 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Due {format(new Date(task.dueDate), "MMM d, yyyy")}
                          </span>
                        </div>

                        {task.assignment && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>Assigned</span>
                          </div>
                        )}

                        <div className="ml-auto flex items-center gap-4">
                          <span>
                            Created:{" "}
                            {format(new Date(task.createdAt), "MMM d, yyyy")}
                          </span>
                          {task.status === "archived" && (
                            <span className="text-gray-600">
                              Archived:{" "}
                              {format(new Date(task.updatedAt), "MMM d, yyyy")}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            task.status === "archived" && "bg-gray-100",
                            task.status === "completed" && "bg-green-100",
                            task.status === "blocked" && "bg-gray-100",
                            task.status === "in_progress" && "bg-blue-100"
                          )}
                        >
                          {task.status.replace("_", " ")}
                        </Badge>

                        {task.isOverdue &&
                          task.status !== "archived" &&
                          task.status !== "completed" && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-red-100 text-red-700"
                            >
                              Overdue
                            </Badge>
                          )}

                        {task.isAtRisk &&
                          !task.isOverdue &&
                          task.status !== "archived" &&
                          task.status !== "completed" && (
                            <Badge
                              variant="outline"
                              className="text-xs bg-yellow-100 text-yellow-700"
                            >
                              At Risk
                            </Badge>
                          )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">
                  Select a project to view its task history
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
