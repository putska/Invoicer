// components/PartsUploadExcel.tsx
"use client";

import React, { useState, useRef, useCallback, DragEvent } from "react";
import * as XLSX from "xlsx-js-style";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";
import { Part } from "../types";

interface PartsUploadExcelProps {
  onUpload: (parts: Part[]) => void;
}

// Helper function to match column headers with flexible patterns
const matchColumnPattern = (header: string, patterns: string[]): boolean => {
  if (!header || typeof header !== "string") return false;

  const normalizedHeader = header.toLowerCase().trim();

  return patterns.some((pattern) => {
    const normalizedPattern = pattern.toLowerCase();

    // Handle wildcard patterns
    if (pattern.includes("*")) {
      const regexPattern = normalizedPattern
        .replace(/\*/g, ".*") // Convert * to regex .*
        .replace(/\s+/g, "\\s*"); // Allow flexible spacing

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(normalizedHeader);
    }

    // Exact match (case insensitive)
    return normalizedHeader === normalizedPattern;
  });
};

// Define column mapping patterns
const COLUMN_PATTERNS = {
  partNo: ["part*", "partno*", "part no*", "part number*"],
  length: ["length*", "len*"],
  markNo: ["mark*", "markno*", "mark no*"],
  finish: ["finish*", "surface*", "coating*"],
  fab: ["fab*", "fabrication*"],
  qty: ["qty*", "quantity*", "count*", "amount*"],
};

// Helper function to find the header row in the worksheet
const findHeaderRow = (
  worksheet: XLSX.WorkSheet
): { headerRow: number; columnMap: Record<string, string> } | null => {
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:A1");

  // Check each row up to row 10 for headers
  for (
    let rowNum = range.s.r;
    rowNum <= Math.min(range.e.r, range.s.r + 9);
    rowNum++
  ) {
    const columnMap: Record<string, string> = {};
    let foundColumns = 0;

    // Check each column in this row
    for (let colNum = range.s.c; colNum <= range.e.c; colNum++) {
      const cellAddress = XLSX.utils.encode_cell({ r: rowNum, c: colNum });
      const cell = worksheet[cellAddress];

      if (cell && cell.v) {
        const headerValue = String(cell.v).trim();

        // Check if this header matches any of our patterns
        for (const [fieldName, patterns] of Object.entries(COLUMN_PATTERNS)) {
          if (matchColumnPattern(headerValue, patterns)) {
            columnMap[fieldName] = headerValue;
            foundColumns++;
            break; // Stop checking other patterns for this header
          }
        }
      }
    }

    // If we found at least partNo and length (minimum required), this is likely our header row
    if (columnMap.partNo && columnMap.length) {
      return { headerRow: rowNum, columnMap };
    }
  }

  return null;
};

export default function PartsUploadExcel({ onUpload }: PartsUploadExcelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Failed to read file");

        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Find the header row and column mapping
        const headerInfo = findHeaderRow(worksheet);

        if (!headerInfo) {
          alert(
            "Could not find valid headers in the Excel file. Please ensure your file contains columns for 'Part No' and 'Length'. Other columns (Mark No, Finish, Fab, Qty) are optional."
          );
          return;
        }

        const { headerRow, columnMap } = headerInfo;

        // Convert to JSON starting from the header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRow, // Start from the identified header row
          defval: null, // Use null for empty cells instead of undefined
        });

        console.log(`Found headers on row ${headerRow + 1}:`, columnMap);
        console.log(`Processing ${jsonData.length} data rows`);

        // Map to Part interface using our flexible column mapping
        const parts: Part[] = jsonData.map((row: any, index) => {
          // Use the mapped column names to extract data
          const partNo = String(row[columnMap.partNo] || ""); // Convert to string first
          const length = parseFloat(row[columnMap.length] || 0);
          const markNo = String(row[columnMap.markNo] || ""); // Convert to string first
          const finish = row[columnMap.finish] || "";
          const fab = row[columnMap.fab] || "";
          const qty = parseInt(row[columnMap.qty] || 1, 10);

          // Validate required fields
          if (!partNo || !length) {
            console.warn(
              `Data row ${
                index + 1
              } is missing required fields (Part No: "${partNo}", Length: ${length})`
            );
          }

          return {
            id: index + 1, // Generate temporary IDs
            partNo: partNo || `Part-${index + 1}`,
            length: length || 0,
            markNo: markNo || `Mark-${index + 1}`,
            finish: finish ? String(finish) : "", // Only convert to string if it exists
            fab: fab ? String(fab) : "", // Only convert to string if it exists
            qty: qty || 1,
          };
        });

        // Filter out invalid rows (must have partNo and length > 0)
        const validParts = parts.filter(
          (part) =>
            part.partNo &&
            part.partNo.trim() !== "" &&
            part.partNo !== `Part-${parts.indexOf(part) + 1}` && // Exclude auto-generated part numbers
            part.length > 0
        );

        if (validParts.length === 0) {
          alert(
            "No valid parts found in the Excel file. Please ensure rows have both Part No and Length values."
          );
          return;
        }

        console.log(`Successfully processed ${validParts.length} valid parts`);
        onUpload(validParts);
      } catch (error) {
        console.error("Error parsing Excel file", error);
        alert(
          "Error parsing Excel file. Please check the format and try again.\n\nExpected columns (flexible naming):\n• Part No/Part Number/PartNo (required)\n• Length (required)\n• Mark No/Mark/MarkNo (optional)\n• Finish/Surface/Coating (optional)\n• Fab/Fabrication (optional)\n• Qty/Quantity/Count (optional)"
        );
      } finally {
        setIsUploading(false);
        // Reset the input so the same file can be selected again if needed
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.onerror = () => {
      alert("Error reading the file");
      setIsUploading(false);
      // Reset the input
      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    reader.readAsBinaryString(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check if it's an Excel file
      if (
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.type === "application/vnd.ms-excel"
      ) {
        processFile(file);
      } else {
        alert("Please upload an Excel file (.xlsx, .xls)");
      }
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-4 border-2 ${
        isDragging
          ? "border-blue-500 bg-blue-50"
          : "border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
      } rounded-lg transition-colors`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <UploadCloud
        className={`h-10 w-10 ${
          isDragging ? "text-blue-500" : "text-gray-400"
        } mb-2`}
      />
      <p className="text-sm text-gray-500 mb-2">
        <span className="font-semibold">Click to upload</span> or drag and drop
      </p>
      <p className="text-xs text-gray-400 mb-2">
        Headers can be anywhere in the first 10 rows
      </p>
      <p className="text-xs text-gray-400 mb-4">
        Required: Part No*, Length* | Optional: Mark*, Finish*, Fab*, Qty*
      </p>
      <div className="relative">
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
          ref={fileInputRef}
        />
        <Button variant="outline" size="sm">
          Select File
        </Button>
      </div>
      {isUploading && (
        <div className="mt-4 text-blue-600">Processing file...</div>
      )}
    </div>
  );
}
