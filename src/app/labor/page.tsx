"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { format, addDays } from "date-fns";
import { Project, Manpower } from "../../../types"; // Assuming types are defined

interface RowData {
  id: number | string; // This can be categoryId or activityId
  name: string;
  category?: boolean; // true for categories, undefined for activities
  [key: string]: any; // Dynamic keys for day columns
}

const LaborGrid: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [rowData, setRowData] = useState<RowData[]>([]);

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

  useEffect(() => {
    // Fetch project list
    const fetchProjects = async () => {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects);
    };

    fetchProjects();
  }, []);

  // When a project is selected, fetch categories, activities, and manpower data
  useEffect(() => {
    const fetchCategoriesAndActivities = async () => {
      try {
        // Fetch categories and activities
        const res = await fetch(
          `/api/getTreeViewData?projectId=${selectedProject}`
        );
        const data = await res.json();
        const fetchedCategories = data.treeViewData.map(
          (categoryItem: Category) => ({
            ...categoryItem,
            activities: categoryItem.activities || [], // Ensure activities array
          })
        );

        // Fetch all manpower data
        const manpowerRes = await fetch(`/api/manpower`);
        const manpowerResponse = await manpowerRes.json();
        const manpowerData = manpowerResponse?.manpowerData || [];

        // Ensure manpowerData is an array
        if (!Array.isArray(manpowerData)) {
          throw new Error("Manpower data is not an array");
        }

        // Dynamically generate the columns based on the project start and end dates
        const project = projects.find((proj) => proj.id === selectedProject);
        if (project) {
          const dynamicColumns = generateDateColumns(
            new Date(project.startDate),
            new Date(project.endDate)
          );

          // Generate row data including categories, activities, and manpower
          const updatedRowData = generateRowData(
            fetchedCategories,
            dynamicColumns,
            manpowerData // Pass all manpower data as the third argument
          );

          // Update state
          setColumnDefs(generateColumnDefs(dynamicColumns));
          setRowData(updatedRowData);
        }
      } catch (error) {
        console.error(
          "Error fetching categories, activities, or manpower:",
          error
        );
      }
    };

    if (selectedProject) {
      fetchCategoriesAndActivities();
    }
  }, [selectedProject, projects]);

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

      columns[columns.length - 1].children.push({
        headerName: dayHeader,
        field: dayField,
        width: 60,
        cellStyle: () => {
          return dayOfWeek === 0 || dayOfWeek === 6
            ? { backgroundColor: "#f0f0f0" } // Light grey for weekends
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

  // Generate column definitions
  const generateColumnDefs = (dynamicColumns: any[]) => {
    return [
      {
        headerName: "Category/Activity",
        field: "name",
        width: 200,
        pinned: "left",
      },
      ...dynamicColumns,
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
      },
      {
        headerName: "Total Hours",
        field: "totalHours",
        width: 150,
        pinned: "left",
        valueGetter: (params: any) => params.getValue("totalManpower") * 8,
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
    const totalRow: RowData = { id: "total", name: "Total" }; // Initialize the total row

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
      });

      // Add each activity under the category
      category.activities.forEach((activity) => {
        const activityRow: RowData = {
          id: activity.activityId,
          name: `     ${activity.activityName}`, // Indented activity name
        };

        // Loop through the columns to add manpower data for each day
        dynamicColumns.forEach((month: any) => {
          month.children.forEach((day: any) => {
            // Use the existing `day.field` without trying to reformat it
            const dayField = day.field; // This is already in the form of "day_yyyy_MM_dd"

            // Find corresponding manpower data for the activity and day
            const manpowerForActivity = manpowerData.find(
              (mp) =>
                mp.activityId === activity.activityId &&
                `day_${mp.date.replace(/-/g, "_")}` === dayField
            );

            // Log to check the matching process
            console.log("Checking match for:", {
              dayField,
              manpowerForActivity,
              activityId: activity.activityId,
            });

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
    manpower: number
  ) => {
    const date = dateField.split("_").slice(1).join("-"); // Extract date from field, e.g., day_2024_09_01 becomes "2024-09-01"

    try {
      const res = await fetch("/api/manpower", {
        method: manpower > 0 ? "POST" : "PUT",
        body: JSON.stringify({
          activityId,
          date,
          manpower,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      if (res.ok) {
        console.log(data.message);
      } else {
        console.error("Failed to save manpower:", data.message);
      }
    } catch (error) {
      console.error("Error saving manpower:", error);
    }
  };

  return (
    <div>
      {/* Project selection */}
      <div className="mb-4">
        <label className="block mb-2">Select Project</label>
        <select
          className="w-full p-2 border border-gray-200 rounded-sm"
          value={selectedProject || ""}
          onChange={(e) => setSelectedProject(Number(e.target.value))}
        >
          <option value="">-- Select a Project --</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
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
          defaultColDef={{
            sortable: true,
            resizable: true,
            editable: true,
          }}
          groupHeaders
          getRowStyle={(params) => {
            if (params.data && params.data.category) {
              return { fontWeight: "bold", backgroundColor: "#f0f0f0" };
            }
            if (!params.data) return {}; // Return empty object if no data
            if (params.data.id === "total") {
              return { fontWeight: "bold", backgroundColor: "#e0e0e0" }; // Bold and different background for total row
            }
            return {};
          }}
          onCellValueChanged={(params) => {
            if (params.data.category) return; // Ignore category rows
            const activityId = Number(params.data.id); // Convert id to a number
            const field = params.colDef.field;
            const manpower = params.newValue;
            if (!field) return; // Ignore category rows
            if (!isNaN(activityId) && field.startsWith("day_")) {
              handleCellEdit(activityId, field, manpower);
            }
          }}
        />
      </div>
    </div>
  );
};

export default LaborGrid;
