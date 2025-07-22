// app/engineering-schedule/page.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  ScheduleData,
  TaskWithAssignment,
  CreateTaskForm,
  Project,
  UpdateTaskForm,
  CreateEngineerForm,
  Engineer,
} from "../../types";
import { EngineerContainer } from "../../components/engineering/EngineerContainer";
import { ProjectContainer } from "../../components/engineering/ProjectContainer";
import { GanttChart } from "../../components/engineering/GanttChart";
import { EngineerManagement } from "../../components/engineering/EngineerManagement";
import { ArchivedTasksView } from "../../components/engineering/ArchivedTasksView";
import { JobHistoryView } from "../../components/engineering/JobHistoryView";
import { TaskEditDialog } from "../../components/engineering/TaskEditDialog";
import { DeleteConfirmationDialog } from "../../components/engineering/DeleteConfirmationDialog";
import { PrintButton } from "../../components/engineering/PrintButton";
import { PrintView } from "../../components/engineering/PrintView";
import { useAuth } from "@clerk/nextjs";
import type { DropResult } from "@hello-pangea/dnd";

interface PrintGanttTask {
  id: number;
  name: string;
  engineerId: number;
  engineerName: string;
  start: Date;
  end: Date;
  status: string;
  projectName: string;
  isLastMinute: boolean;
  isOverdue: boolean;
  isAtRisk: boolean;
}

// Dynamically import DragDropContext to avoid SSR issues
const DragDropContext = dynamic(
  () =>
    import("@hello-pangea/dnd").then((mod) => {
      return { default: mod.DragDropContext };
    }),
  { ssr: false }
);

export default function EngineeringSchedulePage() {
  const { userId } = useAuth();
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<TaskWithAssignment[]>([]);
  const [editingTask, setEditingTask] = useState<TaskWithAssignment | null>(
    null
  );
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [holidaysLoading, setHolidaysLoading] = useState(true);
  const [printType, setPrintType] = useState<
    "full" | "engineers-only" | "projects-only"
  >("full");
  const [holidays, setHolidays] = useState<string[]>([]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch("/api/holidays/office");
        const result = await response.json();
        if (response.ok) {
          setHolidays(result.holidays);
        } else {
          setHolidays([]);
        }
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setHolidays([]);
      } finally {
        setHolidaysLoading(false); // ADD THIS LINE
      }
    };
    fetchHolidays();
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scheduleRes, projectsRes, archivedRes, holidaysRes] =
        await Promise.all([
          fetch("/api/engineering/schedule"),
          fetch("/api/projects"),
          fetch("/api/engineering/tasks/archived"),
          fetch("/api/holidays/office"),
        ]);

      if (!scheduleRes.ok || !projectsRes.ok || !holidaysRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const scheduleJson = await scheduleRes.json();
      const projectsJson = await projectsRes.json();
      const archivedJson = await archivedRes.json();
      const holidaysJson = await holidaysRes.json();

      setScheduleData(scheduleJson.scheduleData);
      setProjects(projectsJson.projects);
      setArchivedTasks(archivedJson.tasks || []);
      setHolidays(holidaysJson.holidays || []); // Set the dynamic holidays
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !userId || !scheduleData) return;

    const { source, destination, draggableId } = result;

    // Extract task ID from draggableId (format: "task-123")
    const taskId = parseInt(draggableId.split("-")[1]);

    // Extract container type and ID from droppableId (format: "engineer-123" or "project-123")
    const [sourceType, sourceIdStr] = source.droppableId.split("-");
    const [destType, destIdStr] = destination.droppableId.split("-");

    const sourceId = parseInt(sourceIdStr);
    const destId = parseInt(destIdStr);

    // If dropped in same place, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Optimistic update for better UX
    const newScheduleData = { ...scheduleData };
    let task: TaskWithAssignment | undefined;

    // Find and remove task from source
    if (sourceType === "engineer") {
      const sourceEngineer = newScheduleData.engineers.find(
        (e) => e.id === sourceId
      );
      if (sourceEngineer) {
        task = sourceEngineer.tasks[source.index];
        sourceEngineer.tasks.splice(source.index, 1);
      }
    } else if (sourceType === "project") {
      const projectTasks = newScheduleData.unassignedTasks.filter(
        (t) => t.projectId === sourceId
      );
      task = projectTasks[source.index];
      const taskIndex = newScheduleData.unassignedTasks.findIndex(
        (t) => t.id === task?.id
      );
      if (taskIndex !== -1) {
        newScheduleData.unassignedTasks.splice(taskIndex, 1);
      }
    }

    if (!task) return;

    // Add task to destination
    if (destType === "engineer") {
      const destEngineer = newScheduleData.engineers.find(
        (e) => e.id === destId
      );
      if (destEngineer) {
        destEngineer.tasks.splice(destination.index, 0, task);
      }
    } else if (destType === "project") {
      // Insert at the correct position among project tasks
      const projectTasks = newScheduleData.unassignedTasks.filter(
        (t) => t.projectId === destId
      );
      const beforeTasks = newScheduleData.unassignedTasks.filter(
        (t) => t.projectId !== destId
      );
      const insertIndex = beforeTasks.length + destination.index;
      newScheduleData.unassignedTasks.splice(insertIndex, 0, task);
    }

    setScheduleData(newScheduleData);

    // Prepare move data
    let moveData: any = {
      taskId,
      toPosition: destination.index,
    };

    // Set source info if task was assigned
    if (sourceType === "engineer") {
      moveData.fromEngineerId = sourceId;
      moveData.fromPosition = source.index;
    }

    // Set destination info if assigning to engineer
    if (destType === "engineer") {
      moveData.toEngineerId = destId;
    }

    try {
      const response = await fetch("/api/engineering/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "move", moveData }),
      });

      if (!response.ok) throw new Error("Failed to move task");

      // Refresh data to get updated schedules
      await fetchData();
    } catch (error) {
      console.error("Error moving task:", error);
      // Revert optimistic update on error
      await fetchData();
    }
  };

  const handleCreateTask = async (task: CreateTaskForm) => {
    if (!userId) return;

    try {
      const response = await fetch("/api/engineering/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });

      if (!response.ok) throw new Error("Failed to create task");

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  };

  const handleCreateEngineer = async (engineer: CreateEngineerForm) => {
    if (!userId) return;

    try {
      const response = await fetch("/api/engineering/engineers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(engineer),
      });

      if (!response.ok) throw new Error("Failed to create engineer");

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error creating engineer:", error);
      throw error;
    }
  };

  const handleUpdateEngineer = async (id: number, data: Partial<Engineer>) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/engineering/engineers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update engineer");

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error updating engineer:", error);
      throw error;
    }
  };

  const handleDeactivateEngineer = async (id: number) => {
    if (!userId) return;

    try {
      const response = await fetch(
        `/api/engineering/engineers/${id}/deactivate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!response.ok) throw new Error("Failed to deactivate engineer");

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error deactivating engineer:", error);
    }
  };

  const handleArchiveTask = async (taskId: number) => {
    if (!userId) return;

    if (!confirm("Are you sure you want to archive this task?")) {
      return;
    }

    try {
      const response = await fetch(`/api/engineering/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "archived" }),
      });

      if (!response.ok) throw new Error("Failed to archive task");

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error archiving task:", error);
    }
  };

  const handleUpdateTask = async (taskId: number, updates: UpdateTaskForm) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/engineering/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) throw new Error("Failed to update task");

      // Close dialog first, then refresh data
      setEditingTask(null);
      await fetchData();
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  };

  const handleRestoreTask = async (taskId: number) => {
    if (!userId) return;

    try {
      const response = await fetch(`/api/engineering/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "unassigned" }),
      });

      if (!response.ok) throw new Error("Failed to restore task");

      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error restoring task:", error);
      throw error;
    }
  };

  const handleDeleteTask = async () => {
    if (!userId || !deletingTaskId) return;

    try {
      const response = await fetch(`/api/engineering/tasks/${deletingTaskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete task");

      setDeletingTaskId(null);
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const handleEditTask = (task: TaskWithAssignment) => {
    setEditingTask(task);
  };

  const handlePrint = (
    type: "full" | "engineers-only" | "projects-only" = "full"
  ) => {
    setPrintType(type);
    // The PrintView component will be rendered and then window.print() will be called
  };

  // Add risk calculations to engineer tasks
  const enhancedScheduleData = scheduleData
    ? {
        ...scheduleData,
        engineers: scheduleData.engineers.map((engineer) => ({
          ...engineer,
          tasks: engineer.tasks.map((task) => {
            // Calculate if task is overdue (scheduled end is after due date)
            const scheduledEnd = task.assignment?.scheduledEnd
              ? new Date(task.assignment.scheduledEnd)
              : null;
            const dueDate = new Date(task.dueDate);
            const isOverdue = scheduledEnd ? scheduledEnd > dueDate : false;

            // Calculate if task is at risk (would finish late if started today)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Helper function to add working days
            const addWorkingDays = (date: Date, days: number) => {
              const result = new Date(date);
              let remainingDays = days;

              while (remainingDays > 0) {
                result.setDate(result.getDate() + 1);
                const dayOfWeek = result.getDay();
                const dateStr = result.toISOString().split("T")[0];

                // Skip weekends and holidays
                if (
                  dayOfWeek !== 0 &&
                  dayOfWeek !== 6 &&
                  !holidays.includes(dateStr)
                ) {
                  remainingDays--;
                }
              }
              return result;
            };

            const wouldFinishBy = addWorkingDays(today, task.durationDays);
            const isAtRisk = wouldFinishBy > dueDate;

            return {
              ...task,
              isOverdue,
              isAtRisk,
            };
          }),
        })),
      }
    : null;
  const ganttTasks: PrintGanttTask[] =
    scheduleData?.engineers.flatMap((engineer) =>
      engineer.tasks
        .filter((task) => task.assignment?.scheduledStart)
        .map((task) => {
          // Calculate if task is overdue (scheduled end is after due date)
          const scheduledEnd = new Date(task.assignment!.scheduledEnd!);
          const dueDate = new Date(task.dueDate);
          const isOverdue = scheduledEnd > dueDate;

          // Calculate if task is at risk (would finish late if started today)
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Helper function to add working days (matching your actions logic)
          const addWorkingDays = (date: Date, days: number) => {
            const result = new Date(date);
            let remainingDays = days;

            while (remainingDays > 0) {
              result.setDate(result.getDate() + 1);
              const dayOfWeek = result.getDay();
              const dateStr = result.toISOString().split("T")[0];

              // Skip weekends and holidays
              if (
                dayOfWeek !== 0 &&
                dayOfWeek !== 6 &&
                !holidays.includes(dateStr)
              ) {
                remainingDays--;
              }
            }
            return result;
          };

          const wouldFinishBy = addWorkingDays(today, task.durationDays);
          const isAtRisk = wouldFinishBy > dueDate;

          return {
            id: task.id,
            name: task.name,
            engineerId: engineer.id,
            engineerName: engineer.name,
            start: new Date(task.assignment!.scheduledStart!),
            end: new Date(task.assignment!.scheduledEnd!),
            status: task.status,
            projectName: task.project.name,
            isLastMinute: task.isLastMinute || false,
            isOverdue: isOverdue,
            isAtRisk: isAtRisk,
          };
        })
    ) || [];

  // Debug logging
  console.log("=== GANTT CHART DEBUG ===");
  console.log(
    "Schedule Data Engineers:",
    scheduleData?.engineers.map((eng) => ({
      name: eng.name,
      taskCount: eng.tasks.length,
      tasks: eng.tasks.map((task) => ({
        id: task.id,
        name: task.name,
        status: task.status,
        hasAssignment: !!task.assignment,
        scheduledStart: task.assignment?.scheduledStart,
        scheduledEnd: task.assignment?.scheduledEnd,
      })),
    }))
  );

  console.log(
    "Filtered Gantt Tasks:",
    ganttTasks.map((task) => ({
      id: task.id,
      name: task.name,
      engineerName: task.engineerName,
      status: task.status,
      start: task.start.toISOString().split("T")[0],
      end: task.end.toISOString().split("T")[0],
      startDate: task.start,
      endDate: task.end,
    }))
  );

  console.log("Tasks being sent to Gantt Chart:", ganttTasks.length);

  if (isLoading || holidaysLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading schedule...</div>
      </div>
    );
  }

  if (!scheduleData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">Failed to load schedule data</div>
      </div>
    );
  }

  // Group unassigned tasks by project (only active projects)
  const activeProjects = projects.filter((p) => p.status === "active");
  const tasksByProject = activeProjects.map((project) => ({
    project,
    tasks: scheduleData.unassignedTasks.filter(
      (task) => task.projectId === project.id
    ),
  }));

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Engineering Schedule</h1>
        <div className="flex items-center gap-2">
          <PrintButton onPrint={() => handlePrint("full")} />
          <JobHistoryView projects={projects} />
          <ArchivedTasksView
            tasks={archivedTasks}
            onRestoreTask={handleRestoreTask}
          />
        </div>
      </div>

      {/* Print View - Hidden on screen, visible when printing */}
      {enhancedScheduleData && (
        <PrintView
          scheduleData={enhancedScheduleData}
          projects={projects}
          printType={printType}
          ganttTasks={ganttTasks}
          holidays={holidays}
        />
      )}

      {/* Gantt Chart - Hidden when printing */}
      <div className="no-print">
        <GanttChart
          engineers={enhancedScheduleData?.engineers || []}
          tasks={ganttTasks}
          holidays={holidays}
        />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Engineer Management - Hidden when printing */}
        <div className="no-print">
          <EngineerManagement
            engineers={scheduleData.engineers}
            onCreateEngineer={handleCreateEngineer}
            onUpdateEngineer={handleUpdateEngineer}
            onDeactivateEngineer={handleDeactivateEngineer}
          />
        </div>

        {/* Engineers Section - Hidden when printing */}
        <div className="no-print">
          <h2 className="text-xl font-semibold mb-4">Engineers</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enhancedScheduleData?.engineers.map((engineer) => (
              <EngineerContainer
                key={engineer.id}
                engineer={engineer}
                onArchiveTask={handleArchiveTask}
                onEditTask={handleEditTask}
                onDeleteTask={setDeletingTaskId}
              />
            ))}
          </div>
        </div>

        {/* Projects Section - Hidden when printing */}
        <div className="no-print">
          <h2 className="text-xl font-semibold mb-4">
            Unassigned Tasks by Project
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasksByProject.map(({ project, tasks }) => (
              <ProjectContainer
                key={project.id}
                project={project}
                tasks={tasks}
                onCreateTask={handleCreateTask}
                onArchiveTask={handleArchiveTask}
                onEditTask={handleEditTask}
                onDeleteTask={setDeletingTaskId}
              />
            ))}
          </div>
        </div>
      </DragDropContext>

      {/* Render dialogs outside of DragDropContext - Hidden when printing */}
      {typeof window !== "undefined" && (
        <div className="no-print">
          <TaskEditDialog
            task={editingTask}
            isOpen={!!editingTask}
            onClose={() => setEditingTask(null)}
            onSave={handleUpdateTask}
          />

          <DeleteConfirmationDialog
            isOpen={!!deletingTaskId}
            onClose={() => setDeletingTaskId(null)}
            onConfirm={handleDeleteTask}
            title="Delete Task?"
            description="Are you sure you want to permanently delete this task? This action cannot be undone."
          />
        </div>
      )}
    </div>
  );
}
