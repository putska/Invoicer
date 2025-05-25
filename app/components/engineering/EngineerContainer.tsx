// components/engineering/EngineerContainer.tsx
"use client";

import { EngineerWithTasks, TaskWithAssignment } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskCard } from "./TaskCard";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface EngineerContainerProps {
  engineer: EngineerWithTasks;
  onArchiveTask?: (taskId: number) => void;
  onEditTask?: (task: TaskWithAssignment) => void;
}

export function EngineerContainer({
  engineer,
  onArchiveTask,
  onEditTask,
}: EngineerContainerProps) {
  // Calculate total days of work
  const totalDays = engineer.tasks.reduce(
    (sum, task) => sum + task.durationDays,
    0
  );

  // Calculate workload status
  const getWorkloadColor = () => {
    if (totalDays > 20) return "text-red-600 bg-red-50";
    if (totalDays > 15) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-600" />
            <CardTitle className="text-lg font-semibold">
              {engineer.name}
            </CardTitle>
          </div>
          <Badge className={cn("text-xs", getWorkloadColor())}>
            {totalDays} day{totalDays !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <Droppable droppableId={`engineer-${engineer.id}`}>
        {(provided, snapshot) => (
          <CardContent
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "min-h-[200px] p-3",
              snapshot.isDraggingOver && "bg-blue-50/50"
            )}
          >
            {engineer.tasks.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                Drop tasks here
              </div>
            ) : (
              <div className="space-y-0">
                {engineer.tasks.map((task, index) => (
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
