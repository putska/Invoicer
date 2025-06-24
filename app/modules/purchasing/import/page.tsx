"use client";

import { useEffect, useState } from "react";

function ImportPOData() {
  const [importStatus, setImportStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Load CSV file and convert to records
  const loadCsvIntoMemory = async () => {
    try {
      // You'll need to convert your Excel to CSV and put POs.csv in the public folder
      const response = await fetch("/POs.csv");
      if (!response.ok) {
        setImportStatus(
          "CSV file not found in public folder. Please convert your Excel file to CSV format."
        );
        return;
      }

      const csvText = await response.text();

      // Import Papa Parse dynamically
      const Papa = await import("papaparse");

      const result = Papa.default.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        delimitersToGuess: [",", "\t", "|", ";"],
      });

      if (result.errors.length > 0) {
        console.warn("CSV parsing warnings:", result.errors);
      }

      setRecords(result.data);
      setImportStatus(
        `Loaded ${result.data.length} PO records from CSV into memory.`
      );
    } catch (error) {
      console.error("Error loading CSV file:", error);
      setImportStatus("Failed to load the CSV file.");
    }
  };

  // Convert Excel row to PO format and import
  const importRecordByIndex = async (poRecord: any, index: number) => {
    try {
      // Parse the date from Excel format
      let poDate = null;
      if (poRecord.Date) {
        poDate = new Date(poRecord.Date).toISOString().split("T")[0];
      }

      // Parse due date if it exists
      let dueDate = null;
      if (poRecord.Due && poRecord.Due !== "") {
        try {
          dueDate = new Date(poRecord.Due).toISOString().split("T")[0];
        } catch (e) {
          // If date parsing fails, leave as null
          console.warn(
            `Could not parse due date for PO ${poRecord["PO#"]}: ${poRecord.Due}`
          );
        }
      }

      const poData = {
        vendorId: Number(poRecord.Vendor), // Make sure this is a number (vendor ID)
        jobId: Number(poRecord.Job), // Make sure this is a number (job ID)
        projectManager: "Import", // Default value since not in Excel
        poDate: poDate,
        dueDate: dueDate,
        amount: "", // Not in your Excel data
        shipTo: poRecord["Ship to"] || "",
        costCode: "", // Not in your Excel data
        shortDescription: (poRecord.Description || "").substring(0, 50),
        longDescription: poRecord.Description || "",
        notes: poRecord.Comments || "",
        received: poRecord.Received || "",
        backorder: poRecord["B/O"] || "",
      };

      const res = await fetch("/api/purchasing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(poData),
      });

      if (res.ok) {
        const result = await res.json();
        return `Imported PO ${
          result.newPurchaseOrder?.poNumber || poRecord["PO#"]
        }`;
      } else {
        const errorData = await res.json();
        throw new Error(`Failed: ${errorData.message || res.statusText}`);
      }
    } catch (error) {
      console.error(`Error importing PO record at index ${index}:`, error);
      throw new Error(
        `Problem importing PO ${poRecord["PO#"]}: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  };

  // Import all PO records one by one
  const startImportProcess = async () => {
    if (isImporting) {
      console.warn("Import process already in progress.");
      return;
    }

    setIsImporting(true);
    setErrors([]);

    const totalRecords = records.length;
    let successfulImports = 0;
    const processingErrors: string[] = [];

    for (let i = 0; i < totalRecords; i++) {
      const record = records[i];

      // Skip empty records
      if (!record["PO#"]) {
        continue;
      }

      try {
        const result = await importRecordByIndex(record, i);
        successfulImports++;
        setImportStatus(
          `Importing ${i + 1} of ${totalRecords} records - ${result}`
        );

        // Small delay to prevent overwhelming the API
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        processingErrors.push(
          `Index ${i}: ${error instanceof Error ? error.message : error}`
        );
        setImportStatus(
          `Importing ${i + 1} of ${totalRecords} records - ${
            error instanceof Error ? error.message : "Error occurred"
          }`
        );
      }
    }

    setIsImporting(false);

    setImportStatus(
      `Import complete! Successfully imported ${successfulImports} of ${totalRecords} PO records. Errors: ${processingErrors.length}`
    );
    setErrors(processingErrors);
  };

  // Load the CSV file when component mounts
  useEffect(() => {
    loadCsvIntoMemory();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Import PO Data
        </h1>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Instructions:
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>
                Convert your Excel file to CSV format (Save As → CSV in Excel)
              </li>
              <li>
                Make sure you've updated all vendor text entries to vendor IDs
                in your CSV file
              </li>
              <li>Convert "2000 Broadway" job to the correct job ID</li>
              <li>Place your updated POs.csv file in the public folder</li>
              <li>Click "Start Import" to begin the process</li>
            </ol>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Status:</p>
            <p className="text-sm text-gray-700">{importStatus}</p>
            {isImporting && (
              <div className="mt-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse"></div>
                <p className="text-xs text-gray-600 mt-1">
                  Processing records...
                </p>
              </div>
            )}
          </div>

          {!isImporting && records.length > 0 && (
            <button
              onClick={startImportProcess}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Start Import Process
            </button>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-red-900 mb-2">
                Errors ({errors.length}):
              </h3>
              <div className="max-h-60 overflow-y-auto">
                <ul className="text-sm text-red-800 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="break-words">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {!isImporting &&
            errors.length === 0 &&
            records.length > 0 &&
            importStatus.includes("complete") && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-green-900 mb-2">
                  Success!
                </h3>
                <p className="text-sm text-green-800">
                  All PO records have been successfully imported into your
                  system.
                </p>
                <button
                  onClick={() => (window.location.href = "/purchasing")}
                  className="mt-3 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  View Purchase Orders
                </button>
              </div>
            )}
        </div>

        {/* Data Preview */}
        {records.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Data Preview (First 3 Records):
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                      PO#
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                      Vendor
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                      Job
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-500">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records.slice(0, 3).map((record, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-gray-900">
                        {record["PO#"]}
                      </td>
                      <td className="px-3 py-2 text-gray-900">
                        {record.Date
                          ? new Date(record.Date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="px-3 py-2 text-gray-900">
                        {record.Vendor}
                      </td>
                      <td className="px-3 py-2 text-gray-900">{record.Job}</td>
                      <td className="px-3 py-2 text-gray-900 max-w-xs truncate">
                        {record.Description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ImportPOData;
