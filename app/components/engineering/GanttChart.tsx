// components/engineering/GanttChart.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { GanttTask, EngineerWithTasks } from "../../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addDays,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  isWeekend,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";

interface GanttChartProps {
  engineers: EngineerWithTasks[];
  tasks: GanttTask[];
  holidays: string[];
}

type TimeScale = "week" | "2weeks" | "month" | "year";

export function GanttChart({ engineers, tasks, holidays }: GanttChartProps) {
  const [timeScale, setTimeScale] = useState<TimeScale>("2weeks");
  const [startDate, setStartDate] = useState(() => startOfWeek(new Date()));
  const svgRef = useRef<SVGSVGElement>(null);

  // Calculate end date based on time scale
  const getEndDate = () => {
    switch (timeScale) {
      case "week":
        return endOfWeek(startDate);
      case "2weeks":
        return addDays(startDate, 13);
      case "month":
        return endOfMonth(startDate);
      case "year":
        return endOfYear(startDate);
    }
  };

  const endDate = getEndDate();
  const totalDays = differenceInDays(endDate, startDate) + 1;

  // Chart dimensions
  const rowHeight = 40;
  const headerHeight = 60;
  const leftPanelWidth = 150;

  // Get the container width and calculate day width based on available space
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const updateWidth = () => {
      if (svgRef.current?.parentElement) {
        const width = svgRef.current.parentElement.clientWidth;
        setContainerWidth(width);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Calculate day width to fill the container
  const availableWidth = containerWidth - leftPanelWidth - 20; // 20px for padding
  const dayWidth = Math.max(availableWidth / totalDays, 20); // Minimum 20px per day
  const chartWidth = leftPanelWidth + totalDays * dayWidth;
  const chartHeight = (engineers.length + 1) * rowHeight + headerHeight;

  // Check if date is a holiday
  const isHoliday = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holidays.includes(dateStr);
  };

  // Navigate time periods
  const navigatePeriod = (direction: "prev" | "next") => {
    const days =
      timeScale === "week"
        ? 7
        : timeScale === "2weeks"
        ? 14
        : timeScale === "month"
        ? 30
        : 365;
    setStartDate((current) =>
      direction === "next" ? addDays(current, days) : addDays(current, -days)
    );
  };

  // Generate date columns
  type DateColumn = {
    date: Date;
    isWeekend: boolean;
    isHoliday: boolean;
    isToday: boolean;
  };
  const dateColumns: DateColumn[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDays(startDate, i);
    dateColumns.push({
      date,
      isWeekend: isWeekend(date),
      isHoliday: isHoliday(date),
      isToday: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
    });
  }

  // Calculate task positions
  const getTaskX = (task: GanttTask) => {
    const daysDiff = differenceInDays(task.start, startDate);
    return leftPanelWidth + daysDiff * dayWidth;
  };

  const getTaskWidth = (task: GanttTask) => {
    const duration = differenceInDays(task.end, task.start) + 1;
    return duration * dayWidth - 4; // 4px padding
  };

  const getTaskY = (engineerId: number) => {
    const engineerIndex = engineers.findIndex((e) => e.id === engineerId);
    return headerHeight + engineerIndex * rowHeight + 8; // 8px padding
  };

  // Task color based on status
  const getTaskColor = (task: GanttTask) => {
    if (task.status === "blocked") return "#9CA3AF"; // gray
    if (task.status === "completed") return "#10B981"; // green
    if (task.isOverdue) return "#EF4444"; // red
    if (task.isAtRisk) return "#F59E0B"; // yellow
    return "#34D399"; // light green
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Engineering Schedule
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigatePeriod("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Select
              value={timeScale}
              onValueChange={(value) => setTimeScale(value as TimeScale)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="2weeks">2 Weeks</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>

            <Button
              size="sm"
              variant="outline"
              onClick={() => navigatePeriod("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setStartDate(startOfWeek(new Date()))}
            >
              Today
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div
          className="w-full"
          style={{
            overflowX: chartWidth > containerWidth ? "auto" : "visible",
          }}
        >
          <svg
            ref={svgRef}
            width={chartWidth}
            height={chartHeight}
            className="gantt-chart w-full"
          >
            {/* Background and grid */}
            <g>
              {/* Weekend and holiday backgrounds */}
              {dateColumns.map((col, i) => (
                <rect
                  key={i}
                  x={leftPanelWidth + i * dayWidth}
                  y={0}
                  width={dayWidth}
                  height={chartHeight}
                  fill={col.isWeekend || col.isHoliday ? "#F3F4F6" : "white"}
                />
              ))}

              {/* Today marker */}
              {dateColumns.map(
                (col, i) =>
                  col.isToday && (
                    <rect
                      key={`today-${i}`}
                      x={leftPanelWidth + i * dayWidth}
                      y={0}
                      width={2}
                      height={chartHeight}
                      fill="#047857"
                    />
                  )
              )}

              {/* Horizontal grid lines */}
              {engineers.map((_, i) => (
                <line
                  key={i}
                  x1={0}
                  y1={headerHeight + (i + 1) * rowHeight}
                  x2={chartWidth}
                  y2={headerHeight + (i + 1) * rowHeight}
                  stroke="#E5E7EB"
                />
              ))}

              {/* Vertical grid lines */}
              {dateColumns.map((_, i) => (
                <line
                  key={i}
                  x1={leftPanelWidth + i * dayWidth}
                  y1={0}
                  x2={leftPanelWidth + i * dayWidth}
                  y2={chartHeight}
                  stroke="#E5E7EB"
                  strokeWidth={0.5}
                />
              ))}
            </g>

            {/* Header */}
            <g>
              <rect
                x={0}
                y={0}
                width={leftPanelWidth}
                height={headerHeight}
                fill="#F9FAFB"
              />
              <text x={10} y={35} className="text-sm font-medium">
                Engineers
              </text>
              <line
                x1={leftPanelWidth}
                y1={0}
                x2={leftPanelWidth}
                y2={chartHeight}
                stroke="#E5E7EB"
              />
              <line
                x1={0}
                y1={headerHeight}
                x2={chartWidth}
                y2={headerHeight}
                stroke="#E5E7EB"
              />

              {/* Date headers */}
              {dateColumns.map((col, i) => {
                // Determine label frequency based on day width
                const showLabel =
                  dayWidth < 30
                    ? i % Math.ceil(30 / dayWidth) === 0 // Show fewer labels when compressed
                    : true; // Show all labels when there's space

                return (
                  showLabel && (
                    <text
                      key={i}
                      x={leftPanelWidth + i * dayWidth + dayWidth / 2}
                      y={25}
                      textAnchor="middle"
                      className="text-xs"
                      style={{ fontSize: dayWidth < 30 ? "10px" : "12px" }}
                    >
                      {format(col.date, dayWidth < 40 ? "d" : "d")}
                    </text>
                  )
                );
              })}

              {/* Month labels for non-year views */}
              {timeScale !== "year" &&
                dateColumns.map((col, i) => {
                  const showMonth =
                    i === 0 ||
                    format(col.date, "MMM") !==
                      format(dateColumns[i - 1].date, "MMM");
                  return (
                    showMonth && (
                      <text
                        key={`month-${i}`}
                        x={leftPanelWidth + i * dayWidth + 5}
                        y={45}
                        className="text-xs font-medium"
                      >
                        {format(col.date, "MMM yyyy")}
                      </text>
                    )
                  );
                })}
            </g>

            {/* Engineer names */}
            <g>
              {engineers.map((engineer, i) => (
                <g key={engineer.id}>
                  <rect
                    x={0}
                    y={headerHeight + i * rowHeight}
                    width={leftPanelWidth}
                    height={rowHeight}
                    fill="#F9FAFB"
                  />
                  <text
                    x={10}
                    y={headerHeight + i * rowHeight + rowHeight / 2 + 5}
                    className="text-sm"
                  >
                    {engineer.name}
                  </text>
                </g>
              ))}
            </g>

            {/* Tasks */}
            <g>
              {tasks.map((task) => {
                const x = getTaskX(task);
                const width = getTaskWidth(task);
                const y = getTaskY(task.engineerId);

                // Only render if task is visible
                if (x + width < leftPanelWidth || x > chartWidth) return null;

                return (
                  <g key={task.id}>
                    <rect
                      x={Math.max(leftPanelWidth, x)}
                      y={y}
                      width={
                        x < leftPanelWidth
                          ? width - (leftPanelWidth - x)
                          : width
                      }
                      height={rowHeight - 16}
                      rx={4}
                      fill={getTaskColor(task)}
                      opacity={0.8}
                    />
                    <text
                      x={Math.max(leftPanelWidth + 5, x + 5)}
                      y={y + rowHeight / 2 - 4}
                      className="text-xs font-medium fill-white"
                      style={{ pointerEvents: "none" }}
                    >
                      {task.name}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
