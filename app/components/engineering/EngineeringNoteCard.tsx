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
import { MoreVertical, Edit, Trash2, CheckSquare, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  EngineeringNoteWithStatuses,
  NoteStatus,
  ChecklistSummary,
} from "../../types";

interface EngineeringNoteCardProps {
  note: EngineeringNoteWithStatuses;
  index: number;
  isDragging?: boolean;
  isCollapsed?: boolean; // Add collapsed prop
  availableStatuses?: NoteStatus[];
  checklistSummary?: ChecklistSummary | null;
  onEdit?: (note: EngineeringNoteWithStatuses) => void;
  onDelete?: (noteId: number) => void;
  onStatusAdd?: (noteId: number, statusId: number) => void;
  onStatusRemove?: (noteId: number, statusId: number) => void;
}

export function EngineeringNoteCard({
  note,
  index,
  isDragging,
  isCollapsed = false, // Default to expanded
  availableStatuses = [],
  checklistSummary,
  onEdit,
  onDelete,
  onStatusAdd,
  onStatusRemove,
}: EngineeringNoteCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

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

  const handleAddStatus = (statusId: number) => {
    setStatusDropdownOpen(false);
    setTimeout(() => {
      if (onStatusAdd) onStatusAdd(note.id, statusId);
    }, 50);
  };

  const handleRemoveStatus = (statusId: number) => {
    if (onStatusRemove) onStatusRemove(note.id, statusId);
  };

  // Get available statuses that aren't already assigned
  const unassignedStatuses = availableStatuses.filter(
    (status) => !note.statuses.some((noteStatus) => noteStatus.id === status.id)
  );

  // Strip HTML tags for preview text
  const getPlainTextContent = (html: string) => {
    const div = document.createElement("div");
    div.innerHTML = html || "";
    return div.textContent || div.innerText || "";
  };

  const plainTextContent = getPlainTextContent(note.content || "");

  // Collapsed view - show statuses above title in a stacked layout
  if (isCollapsed) {
    return (
      <div
        className={cn(
          "mb-1 p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow cursor-move",
          isDragging && "opacity-50"
        )}
        draggable
      >
        <div className="space-y-1">
          {/* Status Badges at the top */}
          {note.statuses.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.statuses.map((status) => (
                <div key={status.id} className="relative group">
                  <Badge
                    className={cn(
                      status.bgColor,
                      status.borderColor,
                      status.textColor,
                      "border text-xs cursor-pointer hover:opacity-80 transition-opacity"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStatus(status.id);
                    }}
                    title={`Click to remove "${status.name}" status`}
                  >
                    {status.name}
                    <X className="h-2 w-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {/* Title and actions row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium truncate flex-1">
              {note.title}
            </span>

            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Add Status Button */}
              {unassignedStatuses.length > 0 && (
                <DropdownMenu
                  open={statusDropdownOpen}
                  onOpenChange={setStatusDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      onClick={(e) => e.stopPropagation()}
                      title="Add status badge"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {unassignedStatuses.map((status) => (
                      <DropdownMenuItem
                        key={status.id}
                        onSelect={(e) => {
                          e.preventDefault();
                          handleAddStatus(status.id);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded ${status.bgColor} ${status.borderColor} border`}
                          />
                          {status.name}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Main Actions Menu */}
              {(onEdit || onDelete) && (
                <DropdownMenu
                  open={dropdownOpen}
                  onOpenChange={setDropdownOpen}
                >
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
                        className="text-red-6wn00"
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
        </div>
      </div>
    );
  }

  // Expanded view - original full card layout
  return (
    <Card
      className={cn(
        "mb-2 shadow-sm hover:shadow-md transition-shadow cursor-move bg-white border-gray-200",
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
            {/* Add Status Button */}
            {unassignedStatuses.length > 0 && (
              <DropdownMenu
                open={statusDropdownOpen}
                onOpenChange={setStatusDropdownOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                    onClick={(e) => e.stopPropagation()}
                    title="Add status badge"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {unassignedStatuses.map((status) => (
                    <DropdownMenuItem
                      key={status.id}
                      onSelect={(e) => {
                        e.preventDefault();
                        handleAddStatus(status.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded ${status.bgColor} ${status.borderColor} border`}
                        />
                        {status.name}
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Main Actions Menu */}
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

          {checklistSummary && checklistSummary.totalItems > 0 && (
            <div className="flex items-center text-xs text-gray-500 gap-1">
              <CheckSquare className="h-4 w-4 shrink-0" />
              <span>
                {checklistSummary.completedItems}/{checklistSummary.totalItems}
              </span>
            </div>
          )}

          {/* Status Badges */}
          {note.statuses.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.statuses.map((status) => (
                <div key={status.id} className="relative group">
                  <Badge
                    className={cn(
                      status.bgColor,
                      status.borderColor,
                      status.textColor,
                      "border text-xs cursor-pointer hover:opacity-80 transition-opacity"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveStatus(status.id);
                    }}
                    title={`Click to remove "${status.name}" status`}
                  >
                    {status.name}
                    <X className="h-2 w-2 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-gray-500">
              <span>{format(new Date(note.updatedAt), "MMM d, h:mm a")}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
