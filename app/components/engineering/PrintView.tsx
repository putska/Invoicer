// components/engineering/PrintView.tsx
"use client";

import { ScheduleData, TaskWithAssignment, Project } from "../../types";
import { PrintGanttChart } from "./PrintGanttChart";

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
}

interface PrintViewProps {
  scheduleData: ScheduleData;
  projects: Project[];
  printType: "full" | "engineers-only" | "projects-only";
  ganttTasks: PrintGanttTask[];
  holidays?: string[];
}

export function PrintView({
  scheduleData,
  projects,
  printType,
  ganttTasks,
  holidays = [],
}: PrintViewProps) {
  const currentDate = new Date().toLocaleDateString();

  const getPriorityClass = (isLastMinute: boolean) => {
    return isLastMinute ? "print-task-high" : "print-task-medium";
  };

  const getStatusClass = (task: TaskWithAssignment) => {
    if (task.status === "completed") return "print-status-completed";
    if (task.status === "blocked") return "print-status-overdue";
    if (task.status === "in_progress") return "print-status-at-risk";
    return "";
  };

  const formatDuration = (days: number) => {
    if (days === 1) return "1 day";
    return `${days} days`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not scheduled";
    return new Date(dateString).toLocaleDateString();
  };

  // Group unassigned tasks by project (only active projects)
  const activeProjects = projects.filter((p) => p.status === "active");
  const tasksByProject = activeProjects.map((project) => ({
    project,
    tasks: scheduleData.unassignedTasks.filter(
      (task) => task.projectId === project.id
    ),
  }));

  return (
    <div className="print:block hidden">
      <div className="print-title">Engineering Schedule</div>
      <div className="print-date">Printed on: {currentDate}</div>

      {/* Print Gantt Chart - Takes up the first page in landscape */}
      <PrintGanttChart
        scheduleData={scheduleData}
        ganttTasks={ganttTasks}
        holidays={holidays}
      />

      {/* Task sections start on new page in portrait */}
      <div className="print-task-sections">
        {(printType === "full" || printType === "engineers-only") && (
          <div>
            <h2 className="text-lg font-bold mb-4 border-b-2 border-gray-300 pb-2">
              Engineers & Assignments
            </h2>

            <div className="print-grid">
              {scheduleData.engineers.map((engineer, index) => (
                <div key={engineer.id} className="print-engineer">
                  <div className="print-engineer-header">
                    {engineer.name}
                    <div className="text-xs font-normal text-gray-600">
                      Email: {engineer.email}
                      {!engineer.active && (
                        <span className="ml-2 text-red-600">(Inactive)</span>
                      )}
                    </div>
                  </div>

                  {engineer.tasks.length === 0 ? (
                    <div className="text-gray-500 text-xs italic">
                      No assigned tasks
                    </div>
                  ) : (
                    engineer.tasks.map((task, taskIndex) => (
                      <div
                        key={task.id}
                        className={`print-task ${getPriorityClass(
                          task.isLastMinute
                        )} ${getStatusClass(task)}`}
                      >
                        <div className="font-medium">{task.name}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          Project: {task.project.name} | Duration:{" "}
                          {formatDuration(task.durationDays)} | Due:{" "}
                          {formatDate(task.dueDate)}
                          {task.isLastMinute && (
                            <span className="ml-2 text-red-600 font-bold">
                              URGENT
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          Status: {task.status.replace("_", " ")}
                        </div>
                        {task.assignment?.scheduledStart && (
                          <div className="text-xs text-gray-600">
                            Scheduled:{" "}
                            {formatDate(task.assignment.scheduledStart)} -{" "}
                            {formatDate(task.assignment.scheduledEnd)}
                          </div>
                        )}
                        {task.notes && (
                          <div className="text-xs text-gray-600 mt-1">
                            {task.notes}
                          </div>
                        )}
                        {/* Add space for manual notes */}
                        <div className="mt-2 text-xs text-gray-400">
                          Notes: ________________________________
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(printType === "full" || printType === "projects-only") && (
          <>
            {printType === "full" && <div className="print-page-break"></div>}
            <div>
              <h2 className="text-lg font-bold mb-4 border-b-2 border-gray-300 pb-2">
                Unassigned Tasks by Project
              </h2>

              <div className="print-grid">
                {tasksByProject.map(({ project, tasks }) => (
                  <div key={project.id} className="print-project">
                    <div className="print-project-header">
                      {project.name}
                      <div className="text-xs font-normal text-gray-600">
                        Status: {project.status} | Tasks: {tasks.length}
                      </div>
                    </div>

                    {tasks.length === 0 ? (
                      <div className="text-gray-500 text-xs italic">
                        All tasks assigned
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <div
                          key={task.id}
                          className={`print-task ${getPriorityClass(
                            task.isLastMinute
                          )} ${getStatusClass(task)}`}
                        >
                          <div className="font-medium">{task.name}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Duration: {formatDuration(task.durationDays)} | Due:{" "}
                            {formatDate(task.dueDate)}
                            {task.isLastMinute && (
                              <span className="ml-2 text-red-600 font-bold">
                                URGENT
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">
                            Status: {task.status.replace("_", " ")}
                          </div>
                          {task.notes && (
                            <div className="text-xs text-gray-600 mt-1">
                              {task.notes}
                            </div>
                          )}
                          {/* Add space for manual assignment notes */}
                          <div className="mt-2 text-xs text-gray-400">
                            Assign to: _____________ | Start: _________
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Summary section for full print */}
      {printType === "full" && (
        <div className="mt-8 pt-4 border-t-2 border-gray-300">
          <h3 className="font-bold mb-2">Summary</h3>
          <div className="text-sm grid grid-cols-2 gap-4">
            <div>
              <div>Total Engineers: {scheduleData.engineers.length}</div>
              <div>
                Total Assigned Tasks:{" "}
                {scheduleData.engineers.reduce(
                  (sum, eng) => sum + eng.tasks.length,
                  0
                )}
              </div>
              <div>
                Total Unassigned Tasks: {scheduleData.unassignedTasks.length}
              </div>
            </div>
            <div>
              <div>Active Projects: {activeProjects.length}</div>
              <div>
                Urgent Tasks:{" "}
                {
                  [
                    ...scheduleData.engineers.flatMap((e) => e.tasks),
                    ...scheduleData.unassignedTasks,
                  ].filter((t) => t.isLastMinute).length
                }
              </div>
              <div>
                Blocked Tasks:{" "}
                {
                  [
                    ...scheduleData.engineers.flatMap((e) => e.tasks),
                    ...scheduleData.unassignedTasks,
                  ].filter((t) => t.status === "blocked").length
                }
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-2 border-t border-gray-200">
            <div className="text-xs">
              <strong>Legend:</strong>
              <span className="ml-2">⚡ In Progress</span>
              <span className="ml-2">⚠ Blocked</span>
              <span className="ml-2">✓ Completed</span>
              <span className="ml-2 text-red-600">■ Urgent (Last Minute)</span>
              <span className="ml-2 text-yellow-600">■ Normal Priority</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
