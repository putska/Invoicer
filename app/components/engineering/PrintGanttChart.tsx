// components/engineering/PrintGanttChart.tsx
"use client";

import { ScheduleData } from "../../types";

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

interface PrintGanttChartProps {
  scheduleData: ScheduleData;
  ganttTasks: PrintGanttTask[];
  holidays?: string[];
}

export function PrintGanttChart({
  scheduleData,
  ganttTasks,
  holidays = [],
}: PrintGanttChartProps) {
  // Calculate date range for the chart
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 7); // Start 1 week ago

  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 28); // End 4 weeks from now

  // If we have tasks, adjust range to include all task dates
  if (ganttTasks.length > 0) {
    const taskStartDates = ganttTasks.map((t) => t.start);
    const taskEndDates = ganttTasks.map((t) => t.end);
    const earliestTask = new Date(
      Math.min(...taskStartDates.map((d) => d.getTime()))
    );
    const latestTask = new Date(
      Math.max(...taskEndDates.map((d) => d.getTime()))
    );

    if (earliestTask < startDate) {
      startDate.setTime(earliestTask.getTime());
      startDate.setDate(startDate.getDate() - 3); // Add some padding
    }
    if (latestTask > endDate) {
      endDate.setTime(latestTask.getTime());
      endDate.setDate(endDate.getDate() + 3); // Add some padding
    }
  }

  // Generate days array
  const days: Date[] = [];
  const currentDay = new Date(startDate);
  while (currentDay <= endDate) {
    days.push(new Date(currentDay));
    currentDay.setDate(currentDay.getDate() + 1);
  }

  // Filter out weekends for a more compact view
  const workDays = days.filter((day) => {
    const dayOfWeek = day.getDay();
    return dayOfWeek !== 0 && dayOfWeek !== 6; // Not Sunday or Saturday
  });

  const isHoliday = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return holidays.includes(dateStr);
  };

  const isToday = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];
    return dateStr === todayStr;
  };

  const getTaskWidth = (task: PrintGanttTask) => {
    const taskStart = new Date(
      Math.max(task.start.getTime(), startDate.getTime())
    );
    const taskEnd = new Date(Math.min(task.end.getTime(), endDate.getTime()));

    const startIndex = workDays.findIndex(
      (day) =>
        day.toISOString().split("T")[0] ===
        taskStart.toISOString().split("T")[0]
    );
    const endIndex = workDays.findIndex(
      (day) =>
        day.toISOString().split("T")[0] === taskEnd.toISOString().split("T")[0]
    );

    if (startIndex === -1 || endIndex === -1) return { left: 0, width: 0 };

    const left = (startIndex / workDays.length) * 100;
    const width = ((endIndex - startIndex + 1) / workDays.length) * 100;

    return { left, width };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
    });
  };

  return (
    <div className="print-gantt-container">
      <div className="print-gantt-title">Project Timeline</div>

      {ganttTasks.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No scheduled tasks to display in timeline
        </div>
      ) : (
        <div className="print-gantt-chart">
          {/* Header with dates */}
          <div className="print-gantt-header">
            <div className="print-gantt-engineer-column">Engineer</div>
            <div className="print-gantt-timeline">
              {workDays.map((day, index) => (
                <div
                  key={index}
                  className={`print-gantt-date ${
                    isToday(day) ? "print-gantt-today" : ""
                  } ${isHoliday(day) ? "print-gantt-holiday" : ""}`}
                >
                  {formatDateHeader(day)}
                </div>
              ))}
            </div>
          </div>

          {/* Engineer rows */}
          {scheduleData.engineers
            .filter((engineer) =>
              engineer.tasks.some((task) => task.assignment?.scheduledStart)
            )
            .map((engineer) => {
              const engineerTasks = ganttTasks.filter(
                (task) => task.engineerId === engineer.id
              );

              return (
                <div key={engineer.id} className="print-gantt-row">
                  <div className="print-gantt-engineer-column">
                    <div className="print-gantt-engineer-name">
                      {engineer.name}
                    </div>
                  </div>
                  <div className="print-gantt-timeline-row">
                    {/* Background grid */}
                    {workDays.map((day, index) => (
                      <div
                        key={index}
                        className={`print-gantt-day-cell ${
                          isToday(day) ? "print-gantt-today-bg" : ""
                        } ${isHoliday(day) ? "print-gantt-holiday-bg" : ""}`}
                      />
                    ))}

                    {/* Tasks */}
                    {engineerTasks.map((task) => {
                      const { left, width } = getTaskWidth(task);
                      if (width === 0) return null;

                      return (
                        <div
                          key={task.id}
                          className={`print-gantt-task ${
                            task.isLastMinute
                              ? "print-gantt-task-urgent"
                              : "print-gantt-task-normal"
                          } ${
                            task.status === "completed"
                              ? "print-gantt-task-completed"
                              : ""
                          }`}
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                        >
                          <div className="print-gantt-task-content">
                            <span className="print-gantt-task-name">
                              {task.name}
                            </span>
                            <span className="print-gantt-task-project">
                              ({task.projectName})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Legend */}
      <div className="print-gantt-legend">
        <div className="text-xs">
          <strong>Timeline Legend:</strong>
          <span className="print-gantt-legend-item">
            <span className="print-gantt-legend-box print-gantt-task-urgent"></span>
            Urgent Tasks
          </span>
          <span className="print-gantt-legend-item">
            <span className="print-gantt-legend-box print-gantt-task-normal"></span>
            Normal Tasks
          </span>
          <span className="print-gantt-legend-item">
            <span className="print-gantt-legend-box print-gantt-task-completed"></span>
            Completed
          </span>
          <span className="print-gantt-legend-item">
            <span className="print-gantt-legend-box print-gantt-today-bg"></span>
            Today
          </span>
        </div>
      </div>
    </div>
  );
}
