"use client";

import React, { useState, useEffect } from "react";
import { AgGridReact } from "ag-grid-react";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { format, addDays } from "date-fns";

interface RowData {
  id: number | string;
  jobNumber?: string;
  jobName?: string;
  [key: string]: any; // Allows dynamic keys for day columns
}

const ExampleGrid: React.FC = () => {
  const [columnDefs, setColumnDefs] = useState<any[]>([]);
  const [rowData, setRowData] = useState<RowData[]>([]);

  useEffect(() => {
    const startDate = new Date("2024-09-01");
    const endDate = new Date("2024-10-31");

    const dynamicColumns = generateDateColumns(startDate, endDate);

    const staticColumns = [
      {
        headerName: "Job Number",
        field: "jobNumber",
        width: 150,
        pinned: "left",
      },
      {
        headerName: "Job Name & Wall Type",
        field: "jobName",
        width: 200,
        pinned: "left",
      },
    ];

    const summaryColumns = [
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

    setColumnDefs([...staticColumns, ...dynamicColumns, ...summaryColumns]);

    const exampleRowData: RowData[] = [
      {
        id: 1,
        jobNumber: "001",
        jobName: "Install Angles",
        day_2024_09_01: 5,
        day_2024_09_02: 6,
      },
      {
        id: 2,
        jobNumber: "002",
        jobName: "Install Units",
        day_2024_09_01: 10,
        day_2024_10_01: 5,
        day_2024_10_02: 5,
        day_2024_10_03: 5,
      },
    ];

    const totalRow = calculateTotals(exampleRowData, dynamicColumns);

    setRowData([...exampleRowData, totalRow]);
  }, []);

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

      columns[columns.length - 1].children.push({
        headerName: dayHeader,
        field: dayField,
        width: 60,
        valueGetter: (params: any) => params.data?.[dayField] || "",
      });

      currentDate = addDays(currentDate, 1);
    }

    return columns;
  };

  const calculateTotals = (data: RowData[], columns: any[]): RowData => {
    const totalRow: RowData = { id: "total", jobName: "Total" };

    columns.forEach((month: any) => {
      month.children.forEach((day: any) => {
        const fieldName = day.field;
        totalRow[fieldName] = data.reduce((sum, row) => {
          return sum + (row[fieldName] || 0);
        }, 0);
      });
    });

    totalRow["totalManpower"] = Object.keys(totalRow).reduce((sum, key) => {
      if (key.startsWith("day_")) {
        return sum + (totalRow[key] || 0);
      }
      return sum;
    }, 0);

    totalRow["totalHours"] = totalRow["totalManpower"] * 8;

    return totalRow;
  };

  return (
    <div className="ag-theme-alpine" style={{ height: "400px", width: "100%" }}>
      <AgGridReact
        columnDefs={columnDefs}
        rowData={rowData}
        defaultColDef={{
          sortable: true,
          resizable: true,
        }}
        groupHeaders
        getRowStyle={(params) => {
          if (params.data && params.data.id === "total") {
            return { fontWeight: "bold", backgroundColor: "#f0f0f0" };
          }
          return {};
        }}
      />
    </div>
  );
};

export default ExampleGrid;
