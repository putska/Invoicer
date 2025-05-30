// components/engineering/EngineeringNoteCard.tsx
"use client";

import { useState, useEffect } from "react";
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
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  CheckSquare,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { EngineeringNote, ChecklistSummary } from "../../types";

interface EngineeringNoteCardProps {
  note: EngineeringNote;
  index: number;
  isDragging?: boolean;
  onEdit?: (note: EngineeringNote) => void;
  onDelete?: (noteId: number) => void;
}

export function EngineeringNoteCard({
  note,
  index,
  isDragging,
  onEdit,
  onDelete,
}: EngineeringNoteCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [summary, setSummary] = useState<ChecklistSummary | null>(null);

  // Determine card color based on status
  const getCardColor = () => {
    switch (note.status) {
      case "completed":
        return "bg-green-50 border-green-200";
      case "blocked":
        return "bg-gray-100 border-gray-300";
      case "in_progress":
        return "bg-blue-50 border-blue-300";
      case "draft":
      default:
        return "bg-yellow-50 border-yellow-300";
    }
  };

  const getStatusIcon = () => {
    switch (note.status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "blocked":
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "draft":
      default:
        return <Circle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusText = () => {
    switch (note.status) {
      case "completed":
        return "Completed";
      case "blocked":
        return "Blocked";
      case "in_progress":
        return "In Progress";
      case "draft":
      default:
        return "Draft";
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchSummary() {
      try {
        const res = await fetch(
          `/api/engineering/notes/checklists/summary/${note.id}`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch checklist summary");
        }
        const data = await res.json();
        if (!cancelled) {
          setSummary(data.summary);
        }
      } catch (error) {
        console.error("Error fetching checklist summary:", error);
      }
    }
    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, [note.id]);

  const handleEdit = () => {
    setDropdownOpen(false);
    setTimeout(() => {
      if (onEdit) onEdit(note);
    }, 50);
  };

  const handleDelete = () => {
    setDropdownOpen(false);
    setTimeout(() => {
      if (onDelete) onDelete(note.id);
    }, 50);
  };

  // Strip HTML tags for preview text
  const getPlainTextContent = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return div.textContent || div.innerText || "";
  };

  const plainTextContent = getPlainTextContent(note.content || "");

  return (
    <Card
      className={cn(
        "mb-2 shadow-sm hover:shadow-md transition-shadow cursor-move",
        getCardColor(),
        isDragging && "opacity-50"
      )}
      draggable
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium leading-tight flex-1 mr-2">
            {note.title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            {(onEdit || onDelete) && (
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
          {plainTextContent && (
            <p className="text-xs text-gray-600 line-clamp-3">
              {plainTextContent}
            </p>
          )}

          {summary && summary.totalItems > 0 && (
            <div className="flex items-center text-xs text-gray-500 gap-1">
              <CheckSquare className="h-4 w-4 shrink-0" />
              <span>
                {summary.completedItems}/{summary.totalItems}
              </span>
              {summary.completedItems === summary.totalItems &&
                summary.totalItems > 0 && (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <Badge variant="outline" className="text-xs">
              {getStatusText()}
            </Badge>

            <div className="flex items-center gap-1 text-gray-500">
              <span>{format(new Date(note.updatedAt), "MMM d, h:mm a")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
