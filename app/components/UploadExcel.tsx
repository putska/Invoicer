// components/UploadExcel.tsx
"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Part } from "../types";
import * as XLSX from "xlsx";

interface UploadExcelProps {
  onUpload: (parts: Part[]) => void;
}

export default function UploadExcel({ onUpload }: UploadExcelProps) {
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

        // Map Excel columns to our Part interface
        const parts: Part[] = jsonData.map((row: any) => {
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
          const part_no = getField([
            "part_no",
            "part number",
            "partno",
            "partnumber",
          ]);
          const length = getField(["length", "len"]);
          const mark_no = getField([
            "mark_no",
            "mark number",
            "markno",
            "marknumber",
            "mark",
          ]);
          const finish = getField(["finish", "color"]);
          const fab = getField(["fab", "fabrication"]);

          return {
            qty: typeof qty === "number" ? qty : parseInt(qty || "1"),
            part_no: part_no?.toString() || "",
            length:
              typeof length === "number" ? length : parseFloat(length || "0"),
            mark_no: mark_no?.toString() || "",
            finish: finish?.toString() || "",
            fab: fab?.toString() || "",
          };
        });

        // Filter out any rows that don't have the minimum required data
        const validParts = parts.filter(
          (part) => part.part_no && part.length > 0
        );

        if (validParts.length === 0) {
          throw new Error("No valid parts found in the Excel file");
        }

        onUpload(validParts);
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
        htmlFor="dropzone-file"
        className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className="w-8 h-8 mb-3 text-gray-400" />
          <p className="mb-2 text-sm text-gray-500">
            <span className="font-semibold">Click to upload</span> or drag and
            drop
          </p>
          <p className="text-xs text-gray-500">Excel files (XLSX, XLS)</p>
        </div>
        <input
          id="dropzone-file"
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
