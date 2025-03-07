// components/PanelUploadExcel.tsx
"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "./panelOptimization";
import * as XLSX from "xlsx-js-style";

interface PanelUploadExcelProps {
  onUpload: (panels: Panel[]) => void;
}

export default function PanelUploadExcel({ onUpload }: PanelUploadExcelProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        // Assume the first sheet contains our data
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Map Excel columns to our Panel interface
        const panels: Panel[] = jsonData.map((row: any, index) => {
          // Try to find the right column names regardless of casing
          const getField = (fieldNames: string[]): any => {
            for (const name of fieldNames) {
              for (const key of Object.keys(row)) {
                if (key.toLowerCase() === name.toLowerCase()) {
                  return row[key];
                }
              }
            }
            return null;
          };

          const qty = getField(["qty", "quantity", "count"]);
          const width = getField(["width", "w"]);
          const height = getField(["height", "h"]);
          const mark_no = getField([
            "mark_no",
            "mark",
            "mark number",
            "id",
            "panel id",
            "panel",
          ]);
          const finish = getField(["finish", "color", "type"]);

          return {
            id: -(index + 1), // Temporary negative ID for new panels
            qty: typeof qty === "number" ? qty : parseInt(qty || "1"),
            width: typeof width === "number" ? width : parseFloat(width || "0"),
            height:
              typeof height === "number" ? height : parseFloat(height || "0"),
            mark_no: mark_no?.toString() || `Panel ${index + 1}`,
            finish: finish?.toString() || "",
          };
        });

        // Filter out any rows that don't have the minimum required data
        const validPanels = panels.filter(
          (panel) => panel.width > 0 && panel.height > 0
        );

        if (validPanels.length === 0) {
          throw new Error("No valid panels found in the Excel file");
        }

        onUpload(validPanels);
      } catch (error) {
        console.error("Error processing Excel file:", error);
        alert(
          `Error processing file: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setIsUploading(false);
        // Clear the input
        e.target.value = "";
      }
    };

    reader.onerror = () => {
      alert("Error reading the file");
      setIsUploading(false);
      // Clear the input
      e.target.value = "";
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex items-center justify-center w-full">
      <label
        htmlFor="panel-dropzone-file"
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500">
            Panel data Excel file (XLSX, XLS)
          </p>
        </div>
        <input
          id="panel-dropzone-file"
          type="file"
          className="hidden"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          disabled={isUploading}
        />
      </label>

      {isUploading && <div className="mt-2 text-blue-600">Uploading...</div>}
    </div>
  );
}
