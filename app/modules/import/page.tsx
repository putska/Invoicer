"use client";

import { useEffect, useState } from "react";

export default function ImportLaborData() {
  const [importStatus, setImportStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [records, setRecords] = useState<any[]>([]); // Hold the CSV records in memory
  const [isImporting, setIsImporting] = useState(false); // Prevent duplicate imports

  // Load CSV into memory and assign unique indices
  const loadCsvIntoMemory = async () => {
    const filePath = "/import.csv"; // Ensure the file is in the `public` folder

    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        setImportStatus("File not found or inaccessible");
        return;
      }

      const text = await response.text();
      const lines = text.split("\n");

      // Extract headers from the first line
      const headers = lines[0].split(",");

      const parsedRecords = lines.slice(1).map((line, index) => {
        const values = line.split(",");
        const record = headers.reduce((obj: Record<string, any>, header, i) => {
          obj[header.trim()] = values[i]?.trim();
          return obj;
        }, {});
        return { ...record, uniqueIndex: index }; // Assign unique index
      });

      setRecords(parsedRecords);
      setImportStatus(`Loaded ${parsedRecords.length} records into memory.`);
    } catch (error) {
      console.error("Error loading CSV file:", error);
      setImportStatus("Failed to load the CSV file.");
    }
  };

  // Import a specific record by index
  const importRecordByIndex = async (laborDataEntry: any, index: number) => {
    try {
      const res = await fetch("/api/labor-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lastName: laborDataEntry["Last Name"],
          firstName: laborDataEntry["First Name"],
          eid: parseInt(laborDataEntry["EID"], 10),
          day: laborDataEntry["Day"],
          date: laborDataEntry["Date"],
          projectName: laborDataEntry["Project Name"],
          jobNumber: laborDataEntry["Job #"],
          costCodeDivision: laborDataEntry["Cost Code Division"],
          costCodeNumber: laborDataEntry["Cost Code #"] || "",
          costCodeDescription: laborDataEntry["Cost Code Description"] || "",
          classification: laborDataEntry["Classification"],
          shift: laborDataEntry["Shift"] || "",
          payType: laborDataEntry["Pay Type"] || "",
          hours: parseFloat(laborDataEntry["Hours"] || "0"),
          startTime: laborDataEntry["Start Time"] || "",
          endTime: laborDataEntry["End Time"] || "",
          breaks: parseInt(laborDataEntry["Breaks"] || "0", 10),
          mealBreaks: parseInt(laborDataEntry["Meal Breaks"] || "0", 10),
          totalBreakTime: laborDataEntry["Total Break Time"] || "",
          workLogName: laborDataEntry["Work Log Name"] || "",
          payrollNotes: laborDataEntry["Payroll Notes"] || "",
        }),
      });

      if (res.ok) {
        return "Imported";
      } else {
        throw new Error(`Failed: ${res.statusText}`);
      }
    } catch (error) {
      console.error(`Error importing record at index ${index}:`, error);
      throw new Error("Problem importing record");
    }
  };

  // Import all records one by one
  const startImportProcess = async () => {
    if (isImporting) {
      console.warn("Import process already in progress.");
      return;
    }

    setIsImporting(true);
    setErrors([]); // Reset errors

    const totalRecords = records.length;
    let successfulImports = 0;
    const processingErrors: string[] = [];

    for (let i = 0; i < totalRecords; i++) {
      const record = records[i];
      try {
        const result = await importRecordByIndex(record, i);
        successfulImports++;
        setImportStatus(
          `Importing ${i + 1} of ${totalRecords} records - ${result}`
        );
      } catch (error) {
        processingErrors.push(
          `Index ${i}: ${error instanceof Error ? error.message : error}`
        );
        setImportStatus(
          `Importing ${
            i + 1
          } of ${totalRecords} records - Problem importing record`
        );
      }
    }

    setIsImporting(false);

    setImportStatus(
      `Import complete. Successfully imported ${successfulImports} of ${totalRecords} records. Errors: ${processingErrors.length}`
    );
    setErrors(processingErrors);
  };

  // Automatically load and start the import process when the page loads
  useEffect(() => {
    const loadAndImport = async () => {
      await loadCsvIntoMemory();
    };
    loadAndImport();
  }, []);

  // Start import process when records change
  useEffect(() => {
    if (records.length > 0) {
      startImportProcess();
    }
  }, [records]);

  return (
    <div>
      <h1>Import Labor Data</h1>
      <p>{importStatus}</p>
      {isImporting && <p>Processing records...</p>}
      {errors.length > 0 && (
        <div>
          <h2>Errors</h2>
          <ul>
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
