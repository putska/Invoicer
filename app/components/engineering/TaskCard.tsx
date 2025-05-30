"use client";

import { TaskWithAssignment } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
  Flag,
  MoreVertical,
  Archive,
  Edit,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { format, set } from "date-fns";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface TaskCardProps {
  task: TaskWithAssignment;
  index: number;
  isDragging?: boolean;
  onArchive?: (taskId: number) => void;
  onEdit?: (task: TaskWithAssignment) => void;
  onDelete?: (taskId: number) => void;
}

type ChecklistSummary = {
  completedItems: number;
  totalItems: number;
};

export function TaskCard({
  task,
  index,
  isDragging,
  onArchive,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [summary, setSummary] = useState<ChecklistSummary | null>(null);

  // Determine card color based on status
  const getCardColor = () => {
    if (task.status === "blocked") return "bg-gray-100 border-gray-300";
    if (task.status === "completed") return "bg-green-50 border-green-200";
    if (task.isOverdue) return "bg-red-50 border-red-300";
    if (task.isAtRisk) return "bg-yellow-50 border-yellow-300";
    if (task.isLastMinute) return "bg-blue-50 border-blue-300";
    return "bg-green-50 border-green-300";
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchSummary() {
      try {
        const res = await fetch(
          `/api/engineering/tasks/checklists/summary/${task.id}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch checklist summary");
        }
        const data = await res.json();
        if (!cancelled) {
          // set state
          setSummary(data.tasks);
        }
      } catch (error) {
        console.error("Error fetching checklist summary:", error);
      }
    }
    fetchSummary();
    return () => {
      cancelled = true; // Cleanup function to prevent state updates on unmounted component
    };
  }, [task.id]);

  const getStatusIcon = () => {
    switch (task.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "blocked":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return null;
    }
  };

  const handleEdit = () => {
    setDropdownOpen(false);
    // Small delay to ensure dropdown is fully closed
    setTimeout(() => {
      if (onEdit) onEdit(task);
    }, 50);
  };

  const handleArchive = () => {
    setDropdownOpen(false);
    setTimeout(() => {
      if (onArchive) onArchive(task.id);
    }, 50);
  };

  const handleDelete = () => {
    setDropdownOpen(false);
    setTimeout(() => {
      if (onDelete) onDelete(task.id);
    }, 50);
  };

  return (
    <Card
      className={cn(
        "mb-2 shadow-sm hover:shadow-md transition-shadow",
        getCardColor(),
        isDragging && "opacity-50"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium leading-tight flex-1 mr-2">
            {task.name}
          </CardTitle>
          <div className="flex items-center gap-1">
            {task.isLastMinute && (
              <span title="Last minute addition">
                <Flag className="h-4 w-4 text-blue-600" />
              </span>
            )}
            {getStatusIcon()}
            {(onArchive || onEdit || onDelete) && (
              <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEdit && (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleEdit();
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {onArchive && (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleArchive();
                      }}
                      className="text-red-600"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault();
                        handleDelete();
                      }}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {task.notes && (
            <p className="text-xs text-gray-600 line-clamp-2">{task.notes}</p>
          )}
          {summary && summary.totalItems > 0 && (
            <div className="flex items-center text-xs text-gray-500 gap-1">
              <CheckSquare className="h-4 w-4 shrink-0" />
              <span>
                {summary.completedItems}/{summary.totalItems}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <Clock className="h-3 w-3" />
              <span>
                {task.durationDays} day{task.durationDays !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span
                className={cn(
                  "font-medium",
                  task.isOverdue && "text-red-600",
                  task.isAtRisk && !task.isOverdue && "text-yellow-600"
                )}
              >
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {task.project.name}
            </Badge>

            {(task.isOverdue || task.isAtRisk) && (
              <AlertCircle
                className={cn(
                  "h-4 w-4",
                  task.isOverdue ? "text-red-600" : "text-yellow-600"
                )}
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
