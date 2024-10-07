// EquipmentGrid.tsx

"use client";

import { useParams } from "next/navigation";
import React, { useState, useEffect, useContext } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { format, addDays } from "date-fns";
import { PermissionContext } from "../../../context/PermissionContext";

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
  equipmentId: number | null;
}

interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

interface ManpowerData {
  activityId: number;
  date: string; // 'YYYY-MM-DD'
  manpower: number;
}

interface Equipment {
  id: number;
  equipmentName: string;
  costPerDay: number;
  costPerWeek: number;
  costPerMonth: number;
}

interface RowData {
  id: number | string; // This can be categoryId or activityId
  name: string;
  level: number;
  category?: boolean; // true for categories, undefined for activities
  totalEquipmentCost?: number;
  [key: string]: any; // Dynamic keys for day columns
}

const EquipmentGrid: React.FC = () => {
  const params = useParams();
  const projectId = params.Id;
  const [project, setProject] = useState<Project | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manpowerData, setManpowerData] = useState<ManpowerData[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [rowData, setRowData] = useState<RowData[]>([]);

  const { isLoaded } = useContext(PermissionContext);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (res.ok) {
          const projectArray = data.project;
          if (Array.isArray(projectArray) && projectArray.length > 0) {
            setProject(projectArray[0]);
          } else {
            console.error("Invalid project data:", data);
          }
        } else {
          console.error("Error fetching project data:", data);
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Fetch categories, activities, manpower, and equipment data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!project) return;

        // Fetch categories and activities
        const resCategories = await fetch(
          `/api/getTreeViewData?projectId=${project.id}`
        );
        const dataCategories = await resCategories.json();
        const fetchedCategories: Category[] = dataCategories.treeViewData.map(
          (categoryItem: any) => ({
            ...categoryItem,
            activities: categoryItem.activities || [],
          })
        );
        console.log("Categories:", fetchedCategories);

        // Fetch manpower data
        const resManpower = await fetch(`/api/manpower`);
        const dataManpower = await resManpower.json();
        const fetchedManpowerData: ManpowerData[] =
          dataManpower?.manpowerData || [];
        console.log("Manpower data:", fetchedManpowerData);
        // Fetch equipment data
        const resEquipment = await fetch(
          `/api/equipment?projectId=${project.id}`
        );
        const dataEquipment = await resEquipment.json();
        const fetchedEquipmentList: Equipment[] =
          dataEquipment?.equipment || [];
        console.log("Equipment data:", fetchedEquipmentList);
        setCategories(fetchedCategories);
        setManpowerData(fetchedManpowerData);
        setEquipmentList(fetchedEquipmentList);

        // Generate columns based on project dates
        const dynamicColumns = generateDateColumns(
          new Date(project.startDate),
          new Date(project.endDate)
        );

        // Generate row data
        const updatedRowData = generateRowData(
          fetchedCategories,
          dynamicColumns,
          fetchedManpowerData,
          fetchedEquipmentList
        );

        // Update state
        setColumnDefs(generateColumnDefs(dynamicColumns));
        setRowData(updatedRowData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [project]);

  // IndentCellRenderer function
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

      columns[columns.length - 1].children.push({
        headerName: dayHeader,
        field: dayField,
        width: 60,
        cellStyle: () => {
          return dayOfWeek === 0 || dayOfWeek === 6
            ? { backgroundColor: "#f0f0f0" } // Light grey for weekends
            : null;
        },
        valueFormatter: (params: any) => {
          const value = params.value;
          //return value ? `$${value.toFixed(2)}` : "";
          return value != null ? value : "";
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
        headerName: "Total Equipment Cost",
        field: "totalEquipmentCost",
        width: 150,
        pinned: "left",
        valueFormatter: (params: any) => {
          const value = params.value;
          return value ? `$${value.toFixed(2)}` : "";
        },
        cellStyle: { fontWeight: "bold" },
      },
      {
        headerName: "Days", // Header group for dynamic day columns
        children: dynamicColumns, // Dynamic columns grouped under the "Days" header
      },
    ];
  };

  // Generate row data based on categories and activities
  const generateRowData = (
    categories: Category[],
    dynamicColumns: any[],
    manpowerData: ManpowerData[],
    equipmentList: Equipment[]
  ) => {
    const rows: RowData[] = [];
    const totalRow: RowData = {
      id: "total",
      name: "Total",
      level: 0,
      totalEquipmentCost: 0,
    };

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
          totalEquipmentCost: 0,
        };

        // Get the equipment assigned to this activity
        const equipment = equipmentList.find(
          (eq) => eq.id === activity.equipmentId
        );

        // Collect the dates when manpower is scheduled for this activity
        const manpowerDates = manpowerData
          .filter(
            (mp) => mp.activityId === activity.activityId && mp.manpower > 0
          )
          .map((mp) => mp.date);

        // Convert manpowerDates to Date objects and filter out weekends
        const workingManpowerDates = manpowerDates.filter((dateStr) => {
          const dateObj = new Date(dateStr);
          const dayOfWeek = dateObj.getDay();
          return dayOfWeek !== 0 && dayOfWeek !== 6; // Exclude Sundays and Saturdays
        });

        // Calculate the total duration (number of working days equipment is used)
        const totalDuration = workingManpowerDates.length;

        // Decide which equipment cost to use
        let selectedCostPerDay = 0;
        if (equipment && totalDuration > 0) {
          if (totalDuration < 4) {
            selectedCostPerDay = equipment.costPerDay;
          } else if (totalDuration < 15) {
            selectedCostPerDay = equipment.costPerWeek;
          } else {
            selectedCostPerDay = equipment.costPerMonth;
          }
        }

        // Loop through the columns to add equipment cost data for each day
        dynamicColumns.forEach((month: any) => {
          month.children.forEach((day: any) => {
            const dayField = day.field;
            const dateStr = dayField.replace("day_", "").replace(/_/g, "-"); // Convert field back to date string
            const dateObj = new Date(dateStr);
            const dayOfWeek = dateObj.getDay();

            // Check if manpower is scheduled on this day and it's a working day
            if (
              manpowerDates.includes(dateStr) &&
              dayOfWeek !== 0 &&
              dayOfWeek !== 6 &&
              equipment &&
              selectedCostPerDay > 0
            ) {
              activityRow[dayField] = selectedCostPerDay;

              // Add the equipment cost to the total for the day
              totalRow[dayField] += selectedCostPerDay;

              // Add to the total equipment cost for the activity
              activityRow.totalEquipmentCost! += selectedCostPerDay;

              // Add to the total equipment cost in the total row
              totalRow.totalEquipmentCost! += selectedCostPerDay;
            } else {
              activityRow[dayField] = null; // No equipment cost for this day
            }
          });
        });

        rows.push(activityRow);
      });
    });

    // Push the total row at the end
    rows.push(totalRow);

    return rows;
  };

  // Handle loading state
  if (!isLoaded || !project) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div>
        <div className="mb-6 bg-blue-100 p-4 rounded-md">
          <h1 className="text-3xl font-bold text-left text-blue-800">
            {project.name}
          </h1>
          <p className="text-gray-700 text-left">{project.description}</p>
        </div>
      </div>
      <div
        className="ag-theme-alpine"
        style={{ height: "600px", width: "100%" }}
      >
        <AgGridReact
          columnDefs={columnDefs}
          rowData={rowData}
          defaultColDef={{
            resizable: true,
            sortable: true,
            editable: false,
          }}
          getRowStyle={(params) => {
            if (!params.data) return undefined; // Return undefined if no data
            if (params.data.id === "total") {
              return { fontWeight: "bold", backgroundColor: "#e0e0e0" }; // Valid RowStyle for total row
            }
            return undefined; // Return undefined for rows with no special style
          }}
        />
      </div>
    </div>
  );
};

export default EquipmentGrid;
