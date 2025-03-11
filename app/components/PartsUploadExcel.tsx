// components/PartsUploadExcel.tsx
"use client";

import React, { useCallback } from "react";
import * as XLSX from "xlsx-js-style";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { Part } from "../types";

interface PartsUploadExcelProps {
  onUpload: (parts: Part[]) => void;
}

export default function PartsUploadExcel({ onUpload }: PartsUploadExcelProps) {
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (!data) throw new Error("Failed to read file");

          const workbook = XLSX.read(data, { type: "binary" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Map to Part interface
          const parts: Part[] = jsonData.map((row: any, index) => {
            // Try to map columns with flexible naming
            const partNo =
              row["Part No"] ||
              row["PartNo"] ||
              row["Part Number"] ||
              row["partNo"] ||
              "";
            const length = parseFloat(row["Length"] || row["length"] || 0);
            const markNo =
              row["Mark No"] ||
              row["MarkNo"] ||
              row["Mark"] ||
              row["markNo"] ||
              "";
            const finish =
              row["Finish"] || row["finish"] || row["Surface"] || "";
            const fab = row["Fab"] || row["fab"] || row["Fabrication"] || "";
            const qty = parseInt(
              row["Qty"] ||
                row["qty"] ||
                row["Quantity"] ||
                row["quantity"] ||
                1,
              10
            );

            // Validate required fields
            if (!partNo || !length) {
              console.warn(`Row ${index + 1} is missing required fields`);
            }

            return {
              id: index + 1, // Generate temporary IDs
              partNo: partNo || `Part-${index + 1}`,
              length: length || 0,
              markNo: markNo || `Mark-${index + 1}`,
              finish,
              fab,
              qty: qty || 1,
            };
          });

          // Filter out invalid rows
          const validParts = parts.filter((part) => part.length > 0);

          if (validParts.length === 0) {
            alert("No valid parts found in the Excel file");
            return;
          }

          onUpload(validParts);
        } catch (error) {
          console.error("Error parsing Excel file", error);
          alert(
            "Error parsing Excel file. Please check the format and try again."
          );
        }
      };

      reader.readAsBinaryString(file);
      // Reset the input so the same file can be selected again if needed
      event.target.value = "";
    },
    [onUpload]
  );

  return (
    <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
      <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
      <p className="text-sm text-gray-500 mb-2">
        Upload an Excel file with your part data
      </p>
      <p className="text-xs text-gray-400 mb-4">
        File should include columns for: Part No, Length, Mark No, Finish, Fab
      </p>
      <div className="relative">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Button variant="outline" size="sm">
          Select File
        </Button>
      </div>
    </div>
  );
}
