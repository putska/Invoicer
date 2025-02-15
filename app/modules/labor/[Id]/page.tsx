// app/modules/labor/[id]/

"use client";

import { useParams } from "next/navigation";
import React, { useState, useEffect, useContext } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { format, addDays } from "date-fns";
import { PermissionContext } from "../../../context/PermissionContext";
import { useSocket } from "../../../context/SocketContext";
import { useRouter } from "next/navigation";
import { GridApi } from "ag-grid-community";

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
  id: number | string; // This can be categoryId or activityId
  name: string;
  level: number;
  category?: boolean; // true for categories, undefined for activities
  [key: string]: any; // Dynamic keys for day columns
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
  const socket = useSocket(); //Get the socket instance from the context

  const onGridReady = (params: { api: GridApi }) => {
    setGridApi(params.api); // Store the grid API instance
  };

  const { hasWritePermission, isLoaded } = useContext(PermissionContext);

  const holidays = [
    "2024-12-23", // DDO
    "2024-12-24", // Christmas Eve
    "2024-12-25", // Christmas
    "2024-11-11", // Veterans Day
    "2024-11-28", // Thanksgiving
    "2024-11-29", // Day after Thanksgiving
    "2025-01-01", // New Year
    "2025-01-20", // MLK Day
    "2025-02-10", // DDO
    "2025-02-17", // Presidents Day
    "2025-04-18", // DDO
    "2025-05-23", // DDO
    "2025-05-26", // Memorial Day
    "2025-07-04", // Independence Day
    "2025-07-07", // DDO
    "2025-08-29", // DDO
    "2025-09-01", // Labor Day
    "2025-11-11", // Veterans Day
    "2025-11-27", // Thanksgiving
    "2025-11-28", // Day after Thanksgiving
    "2025-12-25", // Christmas
    "2025-12-26", // Christmas Day
    "2026-01-01", // New Year
    "2026-01-02", // DDO
    "2026-01-19", // MLK Day
    "2026-02-09", // DDO
    "2026-02-16", // Presidents Day
    "2026-04-03", // DDO
    "2026-05-25", // Memorial Day
    "2026-06-19", // Junteenth
    "2026-07-03", // Independence Day
    "2026-07-06", // DDO
    "2026-08-07", // DDO
    "2026-09-04", // DDO
    "2026-09-07", // Labor Day
    "2026-11-11", // Veterans Day
    "2026-11-26", // Thanksgiving
    "2026-11-27", // Day after Thanksgiving
    "2026-12-24", // Christmas Eve
    "2026-12-25", // Christmas
    "2027-01-01", // New Year
    "2027-01-18", // MLK Day
    "2027-02-15", // Presidents Day
    "2027-03-26", // DDO
    "2027-05-31", // Memorial Day
    "2027-05-28", // DDO
    "2027-06-18", // Junteenth
    "2027-07-05", // Independence Day
    "2027-07-08", // DDO
  ];

  useEffect(() => {
    if (Id) {
      setSelectedProject(Number(Id));
    }
  }, [Id]);

  // Fetch project data when selectedProject changes
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

  // Fetch categories, activities, and manpower data when project data is available
  useEffect(() => {
    if (project) {
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
  }, [project]);

  // Fetch snapshots when the project is selected
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

  /* Socket Stuff!!!! */

  // Listen for real-time updates from the WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleExternalEdit = (data: any) => {
      // Update the grid when receiving real-time data
      setRowData((prevRowData) => {
        return prevRowData.map((row) => {
          if (row.id === data.activityId) {
            return { ...row, [data.dateField]: data.manpower };
          }
          return row;
        });
      });
    };

    // Listen for real-time "edit" events
    //socket.on("edit", handleExternalEdit);

    return () => {
      // Clean up the event listener on unmount
      socket.off("edit", handleExternalEdit);
    };
  }, [socket]);

  const loadSnapshot = async (snapshotId: string) => {
    try {
      const res = await fetch(`/api/snapshot/${snapshotId}`);
      const data = await res.json();
      if (data.length > 0 && data[0].snapshotData) {
        const snapshotData = JSON.parse(data[0].snapshotData);

        // Generate columns based on project dates
        if (project) {
          const dynamicColumns = generateDateColumns(
            new Date(project.startDate),
            new Date(project.endDate)
          );
          setRowData(snapshotData.rowData);

          setColumnDefs(snapshotData.columnDefs);
          setColumnDefs(generateColumnDefs(dynamicColumns));
        }
      }
    } catch (error) {
      console.error("Error loading snapshot:", error);
    }
  };

  // Function to save the current state as a snapshot
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
      } else {
        console.error("Failed to save snapshot");
      }
    } catch (error) {
      console.error("Error saving snapshot:", error);
    }
  };

  // IndentCellRenderer function defined inside the component
  const IndentCellRenderer = (props: any) => {
    const { value, data } = props;
    const level = data.level || 0;
    const indent = level * 15; // Adjust 15 to change indentation size

    const style: React.CSSProperties = {
      paddingLeft: `${indent}px`,
      fontWeight: data.category ? "bold" : "normal", // Bold text for categories
    };

    return <span style={style}>{value}</span>;
  };

  // Generate columns for each day between start and end date
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
          children: [], // This will hold the day columns
        });
      }

      const dayField = `day_${format(currentDate, "yyyy_MM_dd")}`;
      const dayHeader = format(currentDate, "d");
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const currentDateString = format(currentDate, "yyyy-MM-dd"); // Format current date to match holiday format

      columns[columns.length - 1].children.push({
        headerName: dayHeader,
        field: dayField,
        width: 60,
        cellStyle: () => {
          // Determine if the current date is a weekend or holiday
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const isHoliday = holidays.includes(currentDateString);

          return isWeekend || isHoliday
            ? { backgroundColor: "#f0f0f0" } // Light grey for weekends or holidays
            : null;
        },
        valueGetter: (params: any) => {
          const value = params.data?.[dayField];
          return value === 0 ? "" : value; // Don't display 0, show as empty string
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
        width: 200,
        pinned: "left",
        cellRenderer: IndentCellRenderer, // Use 'cellRenderer' instead of 'cellRendererFramework'
        editable: false, // Make the name column non-editable
      },
      {
        headerName: "Days", // Header group for dynamic day columns
        children: dynamicColumns, // Dynamic columns grouped under the "Days" header
      },
      {
        headerName: "Total Manpower",
        field: "totalManpower",
        width: 150,
        pinned: "left",
        valueGetter: (params: any) => {
          return Object.keys(params.data).reduce((sum, key) => {
            if (key.startsWith("day_")) {
              return sum + (params.data[key] || 0);
            }
            return sum;
          }, 0);
        },
        editable: false,
      },
      {
        headerName: "Total Hours",
        field: "totalHours",
        width: 150,
        pinned: "left",
        valueGetter: (params: any) => params.getValue("totalManpower") * 8,
        editable: false,
      },
    ];
  };

  // Generate row data based on categories and activities
  const generateRowData = (
    categories: Category[],
    dynamicColumns: any[],
    manpowerData: any[]
  ) => {
    const rows: RowData[] = [];
    const totalRow: RowData = { id: "total", name: "Total", level: 0 }; // Initialize the total row

    // Initialize totals for each day column
    dynamicColumns.forEach((month: any) => {
      month.children.forEach((day: any) => {
        totalRow[day.field] = 0; // Initialize each day in the total row to 0
      });
    });

    categories.forEach((category) => {
      // Add the category row
      rows.push({
        id: category.categoryId,
        name: category.categoryName,
        category: true,
        level: 0, // Level 0 for categories
      });

      // Add each activity under the category
      category.activities.forEach((activity) => {
        const activityRow: RowData = {
          id: activity.activityId,
          name: activity.activityName,
          level: 1, // Level 1 for activities
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

  // Handle new manpower entry
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
      // Delete manpower entry
      method = "DELETE";
      url += `?activityId=${activityId}&date=${encodeURIComponent(date)}`;
    } else {
      // Create or update manpower entry
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

        //Emit the change to other users via WebSocket
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

  // Update your defaultColDef

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

  const navigateToEquipment = (
    router: any,
    Id: string | string[] | undefined
  ) => {
    if (!Id) {
      console.error("Project ID is undefined!");
      return;
    }

    router.push(`/modules/equipment/${Id}`);
  };
  // Handle loading state
  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        <div className="mb-6 bg-blue-100 p-4 rounded-md">
          <h1 className="text-3xl font-bold text-left text-blue-800">
            {project?.name}
          </h1>
          <p className="text-gray-700 text-left">{project?.description}</p>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={saveSnapshot}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Save Snapshot
        </button>
        <select
          className="p-2 border border-gray-200 rounded-sm"
          value={selectedSnapshot || ""}
          onChange={(e) => {
            const snapshotId = e.target.value;
            if (snapshotId) {
              loadSnapshot(snapshotId);
              setSelectedSnapshot(snapshotId);
            }
          }}
        >
          <option value="">-- Select a Snapshot --</option>
          {snapshots.map((snapshot) => (
            <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
              {snapshot.snapshotId}
            </option>
          ))}
        </select>
      </div>
      <div
        className="ag-theme-alpine"
        style={{ height: "600px", width: "100%" }}
      >
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={defaultColDef}
          getRowStyle={(params) => {
            if (!params.data) return undefined; // Return undefined if no data
            if (params.data.id === "total") {
              return { fontWeight: "bold", backgroundColor: "#e0e0e0" }; // Valid RowStyle for total row
            }
            return undefined; // Return undefined for rows with no special style
          }}
          onCellValueChanged={(params) => {
            if (params.data.category) return; // Ignore category rows
            const activityId = Number(params.data.id); // Convert id to a number
            const field = params.colDef.field;
            const manpower = params.newValue;
            if (!field) return; // Ignore rows without a field
            if (!isNaN(activityId) && field.startsWith("day_")) {
              handleCellEdit(activityId, field, manpower);
            }
          }}
        />
      </div>
      <button
        onClick={() => navigateToEquipment(router, Id)}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Equipment View
      </button>
    </div>
  );
};

export default LaborGrid;
