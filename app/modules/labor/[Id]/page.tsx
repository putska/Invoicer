"use client";

import { useParams } from "next/navigation";
import React, { useState, useEffect, useContext } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { PermissionContext } from "../../../context/PermissionContext";
import { useSocket } from "../../../context/SocketContext";
import { useRouter } from "next/navigation";
import { GridApi } from "ag-grid-community";
import {
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ZoomOut,
  Save,
  ArrowRight,
} from "lucide-react";

// Using native Date methods instead of date-fns
const format = (date: Date, formatStr: string): string => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (formatStr === "MMM yyyy") {
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }
  if (formatStr === "d") {
    return date.getDate().toString();
  }
  if (formatStr === "yyyy_MM_dd") {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}_${month}_${day}`;
  }
  if (formatStr === "yyyy-MM-dd") {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return date.toString();
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

interface Category {
  categoryId: number;
  categoryName: string;
  sortOrder: number;
  activities: Activity[];
}

interface Activity {
  activityId: number;
  activityName: string;
  sortOrder: number;
  estimatedHours: number;
  notes: string;
  completed: boolean;
}

interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RowData {
  id: number | string;
  name: string;
  level: number;
  category?: boolean;
  [key: string]: any;
}

const LaborGrid: React.FC = () => {
  const params = useParams();
  const Id = params.Id;
  const router = useRouter();
  const [gridApi, setGridApi] = useState<GridApi | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [rowData, setRowData] = useState<RowData[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [holidays, setHolidays] = useState<string[]>([]);
  const socket = useSocket();

  // New state for UI improvements
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [gridHeight, setGridHeight] = useState(600);

  const { hasWritePermission, isLoaded } = useContext(PermissionContext);

  const onGridReady = (params: { api: GridApi }) => {
    setGridApi(params.api);
  };

  // Zoom functionality
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.1, 2);
    setZoomLevel(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 0.1, 0.5);
    setZoomLevel(newZoom);
  };

  const handleZoomReset = () => {
    setZoomLevel(1);
  };

  const calculateGridHeight = () => {
    const headerHeight = isHeaderCollapsed ? 60 : 120;
    const controlsHeight = 50;
    const footerHeight = 30;
    const scrollBarBuffer = 100; // Add buffer for horizontal scrollbar
    const viewportHeight = window.innerHeight;
    console.log(
      `Calculated grid height: ${viewportHeight} - ${headerHeight} - ${controlsHeight} - ${footerHeight} - ${scrollBarBuffer} = ${
        viewportHeight -
        headerHeight -
        controlsHeight -
        footerHeight -
        scrollBarBuffer
      }`
    );
    return (
      viewportHeight -
      headerHeight -
      controlsHeight -
      footerHeight -
      scrollBarBuffer
    );
  };

  useEffect(() => {
    const updateGridHeight = () => {
      setGridHeight(calculateGridHeight());
    };

    // Initial calculation after DOM is ready
    updateGridHeight();

    // Also recalculate after a short delay to ensure proper layout
    const timeoutId = setTimeout(updateGridHeight, 100);

    window.addEventListener("resize", updateGridHeight);
    return () => {
      window.removeEventListener("resize", updateGridHeight);
      clearTimeout(timeoutId);
    };
  }, [isHeaderCollapsed]);

  // useEffect for fetching holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        // For engineering schedules, use office holidays
        const response = await fetch("/api/holidays/field");
        const result = await response.json();

        if (response.ok) {
          setHolidays(result.holidays);
        } else {
          console.error("Failed to fetch holidays:", result.message);
          // Fallback to empty array or handle error
          setHolidays([]);
        }
      } catch (error) {
        console.error("Error fetching holidays:", error);
        setHolidays([]);
      }
    };

    fetchHolidays();
  }, []);

  // Your existing useEffect for setting selectedProject
  useEffect(() => {
    if (Id) {
      setSelectedProject(Number(Id));
    }
  }, [Id]);

  // Your existing useEffect for fetching project data
  useEffect(() => {
    if (selectedProject) {
      const fetchProject = async () => {
        try {
          const projectRes = await fetch(`/api/projects/${selectedProject}`);
          const projectData = await projectRes.json();
          const projectArray = projectData.project;

          if (Array.isArray(projectArray) && projectArray.length > 0) {
            const project = projectArray[0];
            setProject(project);
          } else {
            console.error("Invalid project data:", projectData);
            return;
          }
        } catch (error) {
          console.error("Error fetching project data:", error);
        }
      };

      fetchProject();
    }
  }, [selectedProject]);

  // Your existing useEffect for fetching categories, activities, and manpower data
  useEffect(() => {
    if (project && holidays.length > 0) {
      const fetchCategoriesAndActivities = async () => {
        try {
          // Fetch categories and activities
          const res = await fetch(
            `/api/getTreeViewData?projectId=${project.id}`
          );
          const data = await res.json();
          const fetchedCategories = data.treeViewData.map(
            (categoryItem: Category) => ({
              ...categoryItem,
              activities: categoryItem.activities || [],
            })
          );

          // Fetch all manpower data
          const manpowerRes = await fetch(`/api/manpower`);
          const manpowerResponse = await manpowerRes.json();
          const manpowerData = manpowerResponse?.manpowerData || [];
          if (!Array.isArray(manpowerData)) {
            throw new Error("Manpower data is not an array");
          }

          setCategories(fetchedCategories);

          // Generate columns based on project dates
          const dynamicColumns = generateDateColumns(
            new Date(project.startDate),
            new Date(project.endDate)
          );

          // Generate row data
          const updatedRowData = generateRowData(
            fetchedCategories,
            dynamicColumns,
            manpowerData
          );

          // Update state
          setColumnDefs(generateColumnDefs(dynamicColumns));
          setRowData(updatedRowData);
        } catch (error) {
          console.error(
            "Error fetching categories, activities, or manpower:",
            error
          );
        }
      };

      fetchCategoriesAndActivities();
    }
  }, [project, holidays]);

  // Separate effect for zoom level changes
  useEffect(() => {
    if (project && categories.length > 0) {
      const dynamicColumns = generateDateColumns(
        new Date(project.startDate),
        new Date(project.endDate)
      );
      setColumnDefs(generateColumnDefs(dynamicColumns));
    }
  }, [zoomLevel]);

  // Your existing useEffect for fetching snapshots
  useEffect(() => {
    if (selectedProject) {
      const fetchSnapshots = async () => {
        try {
          const snapshotRes = await fetch(
            `/api/snapshot/all/${selectedProject}`
          );
          const snapshotData = await snapshotRes.json();
          setSnapshots(snapshotData.snapshots || []);
        } catch (error) {
          console.error("Error fetching snapshots:", error);
        }
      };

      fetchSnapshots();
    }
  }, [selectedProject]);

  // Your existing socket useEffect
  useEffect(() => {
    if (!socket) return;

    const handleExternalEdit = (data: any) => {
      setRowData((prevRowData) => {
        return prevRowData.map((row) => {
          if (row.id === data.activityId) {
            return { ...row, [data.dateField]: data.manpower };
          }
          return row;
        });
      });
    };

    socket.on("edit", handleExternalEdit);

    return () => {
      socket.off("edit", handleExternalEdit);
    };
  }, [socket]);

  // IndentCellRenderer with zoom support
  const IndentCellRenderer = (props: any) => {
    const { value, data } = props;
    const level = data.level || 0;
    const indent = level * 15 * zoomLevel;

    const style: React.CSSProperties = {
      paddingLeft: `${indent}px`,
      fontWeight: data.category ? "bold" : "normal",
      fontSize: `${14 * zoomLevel}px`,
      lineHeight: `${20 * zoomLevel}px`,
    };

    return <span style={style}>{value}</span>;
  };

  // Generate date columns without the "Days" header group
  const generateDateColumns = (startDate: Date, endDate: Date): any[] => {
    const columns: any[] = [];
    let currentDate = startDate;
    let currentMonth = "";

    while (currentDate <= endDate) {
      const monthYear = format(currentDate, "MMM yyyy");

      if (monthYear !== currentMonth) {
        currentMonth = monthYear;
        columns.push({
          headerName: monthYear,
          children: [],
        });
      }

      const dayField = `day_${format(currentDate, "yyyy_MM_dd")}`;
      const dayHeader = format(currentDate, "d");
      const dayOfWeek = currentDate.getDay();
      const currentDateString = format(currentDate, "yyyy-MM-dd");

      columns[columns.length - 1].children.push({
        headerName: dayHeader,
        field: dayField,
        width: Math.max(40, 60 * zoomLevel),
        cellStyle: () => {
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isHoliday = holidays.includes(currentDateString);
          return isWeekend || isHoliday
            ? { backgroundColor: "#f0f0f0", fontSize: `${12 * zoomLevel}px` }
            : { fontSize: `${12 * zoomLevel}px` };
        },
        valueGetter: (params: any) => {
          const value = params.data?.[dayField];
          return value === 0 ? "" : value;
        },
      });

      currentDate = addDays(currentDate, 1);
    }

    return columns;
  };

  const generateColumnDefs = (dynamicColumns: any[]) => {
    return [
      {
        headerName: "Category/Activity",
        field: "name",
        width: Math.max(150, 200 * zoomLevel),
        pinned: "left",
        cellRenderer: IndentCellRenderer,
        editable: false,
      },
      // Direct inclusion of dynamic columns without wrapper
      ...dynamicColumns,
      {
        headerName: "Total MP",
        field: "totalManpower",
        width: Math.max(80, 120 * zoomLevel),
        pinned: "right",
        valueGetter: (params: any) => {
          return Object.keys(params.data).reduce((sum, key) => {
            if (key.startsWith("day_")) {
              return sum + (params.data[key] || 0);
            }
            return sum;
          }, 0);
        },
        editable: false,
        cellStyle: { fontSize: `${12 * zoomLevel}px` },
      },
      {
        headerName: "Total Hrs",
        field: "totalHours",
        width: Math.max(80, 120 * zoomLevel),
        pinned: "right",
        valueGetter: (params: any) => params.getValue("totalManpower") * 8,
        editable: false,
        cellStyle: { fontSize: `${12 * zoomLevel}px` },
      },
    ];
  };

  // Your existing generateRowData function
  const generateRowData = (
    categories: Category[],
    dynamicColumns: any[],
    manpowerData: any[]
  ) => {
    const rows: RowData[] = [];
    const totalRow: RowData = { id: "total", name: "Total", level: 0 };

    // Initialize totals for each day column
    dynamicColumns.forEach((month: any) => {
      month.children.forEach((day: any) => {
        totalRow[day.field] = 0;
      });
    });

    categories.forEach((category) => {
      // Add the category row
      rows.push({
        id: category.categoryId,
        name: category.categoryName,
        category: true,
        level: 0,
      });

      // Add each activity under the category
      category.activities.forEach((activity) => {
        const activityRow: RowData = {
          id: activity.activityId,
          name: activity.activityName,
          level: 1,
        };

        // Loop through the columns to add manpower data for each day
        dynamicColumns.forEach((month: any) => {
          month.children.forEach((day: any) => {
            const dayField = day.field;

            // Find corresponding manpower data for the activity and day
            const manpowerForActivity = manpowerData.find(
              (mp) =>
                mp.activityId === activity.activityId &&
                `day_${mp.date.replace(/-/g, "_")}` === dayField
            );

            const manpowerCount = manpowerForActivity
              ? manpowerForActivity.manpower
              : 0;
            activityRow[day.field] = manpowerCount;

            // Add the manpower count to the total for the day
            totalRow[day.field] += manpowerCount;
          });
        });

        rows.push(activityRow);
      });
    });

    // Push the total row at the end
    rows.push(totalRow);

    return rows;
  };

  // Your existing handleCellEdit function
  const handleCellEdit = async (
    activityId: number,
    dateField: string,
    manpower: any
  ) => {
    const date = dateField.split("_").slice(1).join("-");
    const manpowerValue = parseFloat(manpower);

    let method;
    let url = "/api/manpower";
    let body;

    if (isNaN(manpowerValue) || manpowerValue === 0) {
      method = "DELETE";
      url += `?activityId=${activityId}&date=${encodeURIComponent(date)}`;
    } else {
      method = "POST";
      body = JSON.stringify({
        activityId,
        date,
        manpower: manpowerValue,
      });
    }

    try {
      const res = await fetch(url, {
        method,
        body,
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (res.ok) {
        console.log(data.message);

        if (socket) {
          socket.emit("edit", {
            activityId,
            dateField,
            manpower: manpowerValue,
          });
        }
      } else {
        console.error("Failed to save manpower:", data.message);
      }
    } catch (error) {
      console.error("Error saving manpower:", error);
    }
  };

  // Your existing snapshot functions
  const loadSnapshot = async (snapshotId: string) => {
    try {
      const res = await fetch(`/api/snapshot/${snapshotId}`);
      const data = await res.json();
      if (data.length > 0 && data[0].snapshotData) {
        const snapshotData = JSON.parse(data[0].snapshotData);

        if (project) {
          const dynamicColumns = generateDateColumns(
            new Date(project.startDate),
            new Date(project.endDate)
          );
          setRowData(snapshotData.rowData);
          setColumnDefs(generateColumnDefs(dynamicColumns));
        }
      }
    } catch (error) {
      console.error("Error loading snapshot:", error);
    }
  };

  const saveSnapshot = async () => {
    if (!selectedProject) return;
    const snapshotData = {
      rowData,
      columnDefs,
    };
    try {
      const res = await fetch(`/api/snapshot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: selectedProject,
          snapshotData,
        }),
      });
      if (res.ok) {
        console.log("Snapshot saved successfully");
        // Refresh snapshots list
        const snapshotRes = await fetch(`/api/snapshot/all/${selectedProject}`);
        const snapshotData = await snapshotRes.json();
        setSnapshots(snapshotData.snapshots || []);
      } else {
        console.error("Failed to save snapshot");
      }
    } catch (error) {
      console.error("Error saving snapshot:", error);
    }
  };

  const defaultColDef = {
    sortable: true,
    resizable: true,
    editable: (params: any) => {
      if (!params.data) return false;
      if (!isLoaded) return false;
      return (
        hasWritePermission &&
        !params.data.category &&
        params.data.id !== "total"
      );
    },
  };

  const navigateToEquipment = () => {
    if (!Id) {
      console.error("Project ID is undefined!");
      return;
    }
    router.push(`/modules/equipment/${Id}`);
  };

  // Handle loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Collapsible Header */}
      <div
        className={`bg-gradient-to-r from-blue-600 to-blue-700 text-white transition-all duration-300 ${
          isHeaderCollapsed ? "p-2" : "p-4"
        }`}
      >
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1
                className={`font-bold text-white transition-all duration-300 ${
                  isHeaderCollapsed ? "text-lg" : "text-2xl"
                }`}
              >
                {project?.name || "Loading..."}
              </h1>
              <button
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                className="p-1 hover:bg-blue-800 rounded transition-colors"
              >
                {isHeaderCollapsed ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronUp size={16} />
                )}
              </button>
            </div>
            {!isHeaderCollapsed && project?.description && (
              <p className="text-blue-100 mt-1 text-sm">
                {project.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Compact Controls Bar */}
      <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
            <button
              onClick={handleZoomOut}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="px-2 text-sm font-mono min-w-[3rem] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded transition-colors"
              title="Reset Zoom"
            >
              100%
            </button>
          </div>

          {/* Snapshot Controls */}
          <button
            onClick={saveSnapshot}
            className="flex items-center gap-1 px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm transition-colors"
          >
            <Save size={14} />
            Save
          </button>

          <select
            className="px-2 py-1 border border-gray-300 rounded text-sm"
            value={selectedSnapshot || ""}
            onChange={(e) => {
              const snapshotId = e.target.value;
              if (snapshotId) {
                loadSnapshot(snapshotId);
                setSelectedSnapshot(snapshotId);
              }
            }}
          >
            <option value="">Load Snapshot...</option>
            {snapshots.map((snapshot) => (
              <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                {snapshot.snapshotId}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={navigateToEquipment}
          className="flex items-center gap-1 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition-colors"
        >
          Equipment View
          <ArrowRight size={14} />
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-hidden">
        <div className="ag-theme-alpine h-full" style={{ height: gridHeight }}>
          <AgGridReact
            columnDefs={columnDefs}
            rowData={rowData}
            defaultColDef={defaultColDef}
            onGridReady={onGridReady}
            headerHeight={Math.max(24, 32 * zoomLevel)}
            rowHeight={Math.max(24, 32 * zoomLevel)}
            getRowStyle={(params) => {
              if (!params.data) return undefined;
              if (params.data.id === "total") {
                return {
                  fontWeight: "bold",
                  backgroundColor: "#e0e0e0",
                  fontSize: `${12 * zoomLevel}px`,
                };
              }
              return {
                fontSize: `${12 * zoomLevel}px`,
                fontWeight: "normal",
                backgroundColor: "transparent",
              };
            }}
            onCellValueChanged={(params) => {
              if (params.data.category) return;
              const activityId = Number(params.data.id);
              const field = params.colDef.field;
              const manpower = params.newValue;
              if (!field) return;
              if (!isNaN(activityId) && field.startsWith("day_")) {
                handleCellEdit(activityId, field, manpower);
              }
            }}
            suppressHorizontalScroll={false}
            suppressMovableColumns={true}
            animateRows={true}
          />
        </div>
      </div>

      {/* Compact Status Bar */}
      <div className="bg-gray-100 border-t border-gray-200 px-3 py-1 text-xs text-gray-600 flex justify-between items-center">
        <span>Ready • {rowData.length} rows</span>
        <span>
          {project?.startDate} - {project?.endDate}
        </span>
      </div>
    </div>
  );
};

export default LaborGrid;
