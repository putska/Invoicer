"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { format, addMonths } from "date-fns";
import { Project, SummaryManpower } from "../../../types";
import ProjectNameRenderer from "./ProjectNameRenderer";

const ManpowerSummary: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [manpowerData, setManpowerData] = useState<SummaryManpower[]>([]);
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [rowData, setRowData] = useState<any[]>([]);
  const [totalRow, setTotalRow] = useState<any>({});

  useEffect(() => {
    // Fetch projects and manpower data
    const fetchData = async () => {
      const projectsRes = await fetch("/api/projects");
      const manpowerRes = await fetch("/api/summaryManpower");
      const projectsData = await projectsRes.json();
      const manpowerData = await manpowerRes.json();

      setProjects(projectsData.projects);
      setManpowerData(manpowerData.data);

      // Generate the calendar and the column definitions for AG Grid
      const dynamicColumns = generateDateColumns(
        new Date(),
        addMonths(new Date(), 36)
      );
      setColumnDefs(generateColumnDefs(dynamicColumns));

      // Transform the data to match the required format
      const transformedData = transformData(
        projectsData.projects,
        manpowerData.data,
        dynamicColumns
      );

      // Calculate the total row
      const totalRow = calculateTotalRow(transformedData, dynamicColumns);

      console.log("Transformed Data:", transformedData);
      console.log("Total Row:", totalRow);
      // Generate row data using projects, manpower, and the calendar months
      setRowData([...transformedData, totalRow]); // Append the total row to the transformed data
    };

    fetchData();
  }, []);

  // Helper function to transform the data
  const transformData = (
    projects: Project[],
    manpowerData: SummaryManpower[],
    dynamicColumns: any[]
  ) => {
    return projects.map((project) => {
      const projectData: any = {
        project_id: project.id,
        project_name: project.name,
      };

      dynamicColumns.forEach((column) => {
        column.children.forEach((child: any) => {
          const [year, month] = child.field.split("-").map(Number);

          // Find manpower data for the specific project, year, and month
          const manpowerEntry = manpowerData.find(
            (entry) =>
              entry.project_id === project.id &&
              Number(entry.year) === year &&
              Number(entry.month) === month
          );

          // Assign manpower to the correct field in the row data
          projectData[child.field] = manpowerEntry
            ? roundUpToEven(Number(manpowerEntry.average_manpower))
            : 0;
        });
      });

      return projectData;
    });
  };

  // Helper function to generate date columns
  const generateDateColumns = (startDate: Date, endDate: Date) => {
    const columns = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // getMonth() returns 0-based month
      const monthName = format(currentDate, "MMM").toUpperCase(); // Format month as "JAN", "FEB", etc.

      // Grouping by year, with months as child columns
      const yearColumn = columns.find(
        (col) => col.headerName === year.toString()
      );

      if (!yearColumn) {
        columns.push({
          headerName: year.toString(),
          children: [
            {
              headerName: monthName,
              field: `${year}-${month}`, // Field name should match how data is referenced
              width: 100,
              cellStyle: (params: any) => {
                const projectColor = getProjectColor(params.data?.project_id);
                return {
                  backgroundColor: params.value > 0 ? projectColor : undefined, // Color cells with data
                };
              },
              valueGetter: (params: any) =>
                params.data?.[`${year}-${month}`] || "", // Avoid displaying 0
            },
          ],
        });
      } else {
        yearColumn.children.push({
          headerName: monthName,
          field: `${year}-${month}`,
          width: 100,
          cellStyle: (params: any) => {
            const projectColor = getProjectColor(params.data?.project_id);
            return {
              backgroundColor: params.value > 0 ? projectColor : undefined,
            };
          },
          valueGetter: (params: any) => params.data?.[`${year}-${month}`] || "",
        });
      }

      currentDate = addMonths(currentDate, 1);
    }

    return columns;
  };

  // Helper function to generate column definitions for AG Grid
  const generateColumnDefs = (dynamicColumns: any[]) => {
    const staticColumns = [
      { headerName: "Project ID", field: "project_id" },
      {
        headerName: "Project Name",
        field: "project_name",
        cellRenderer: ProjectNameRenderer, // Use cellRenderer with the component
      },
    ];

    return [...staticColumns, ...dynamicColumns];
  };

  const roundUpToEven = (num: number) => {
    const roundedUp = Math.ceil(num); // Round up to the nearest integer
    return roundedUp % 2 === 0 ? roundedUp : roundedUp + 1; // If already even, return it, otherwise, make it even
  };

  // Generate a random color based on project ID
  const getProjectColor = (projectId: number | string) => {
    const colors = ["#ff9999", "#99ccff", "#99ff99", "#ffcc99", "#ffb3ff"];
    return colors[Number(projectId) % colors.length];
  };

  // Calculate total manpower for each column
  const calculateTotalRow = (transformedData: any[], dynamicColumns: any[]) => {
    const totalRow: any = { project_name: "Total" }; // Project name for the total row

    dynamicColumns.forEach((column) => {
      column.children.forEach((child: any) => {
        totalRow[child.field] = transformedData.reduce((sum, row) => {
          return sum + (row[child.field] || 0);
        }, 0);
      });
    });

    return totalRow;
  };

  return (
    <div className="ag-theme-alpine" style={{ height: "600px", width: "100%" }}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={[...rowData, totalRow]} // Append total row
        defaultColDef={{
          sortable: true,
          resizable: true,
        }}
        groupHeaders
        getRowStyle={(params) => {
          if (params.data?.project_name === "Total") {
            return { fontWeight: "bold", backgroundColor: "#f0f0f0" };
          }
          return {};
        }}
      />
    </div>
  );
};

export default ManpowerSummary;
