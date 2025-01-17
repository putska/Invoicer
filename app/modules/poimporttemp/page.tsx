"use client";

import { useEffect, useState, useRef } from "react";

export default function ImportPOLog() {
  const [importStatus, setImportStatus] = useState("");
  const isProcessing = useRef(false); // Track processing state

  useEffect(() => {
    const handleFileProcessing = async () => {
      if (isProcessing.current) return; // Prevent re-entry
      isProcessing.current = true;

      // Path to the PO log file (ensure it's in the `public` folder)
      const filePath = "/Cleaned_Purchase_Order_Log.csv";

      try {
        // Fetch the file contents
        const response = await fetch(filePath);
        if (!response.ok) {
          setImportStatus("File not found or inaccessible");
          return;
        }

        const text = await response.text();

        // Parse the CSV file content using a proper parser
        const rows = text.split("\n").filter((line) => line.trim() !== ""); // Remove empty lines
        const headers = rows[0]
          .split(",")
          .map((header) => header.replace(/^"|"$/g, "").trim()); // Remove quotes and trim whitespace from headers

        for (let i = 1; i < rows.length; i++) {
          const values = rows[i]
            .split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/) // Handle commas inside quotes
            .map((value) => value.replace(/^"|"$/g, "").trim()); // Remove quotes and trim whitespace

          // Map values to headers
          const poDataEntry = headers.reduce(
            (obj: { [key: string]: any }, header, index) => {
              obj[header] = values[index] || null; // Handle missing values
              return obj;
            },
            {}
          );

          // Map the fields to match the API schema
          const poPayload = {
            vendorId: parseInt(poDataEntry["VendorID"], 10),
            poNumber: poDataEntry["PO#"],
            jobId: parseInt(poDataEntry["JobID"], 10),
            projectManager: "  ", // Update if needed
            poDate: poDataEntry["DATE"],
            dueDate: poDataEntry["DUE"] ? poDataEntry["DUE"] : null, // Handle blank dueDate
            shipTo: poDataEntry["SHIP TO"] || " ",
            costCode: "  ", // Update if required
            shortDescription: poDataEntry["DESCRIPTION"].slice(0, 50),
            longDescription: poDataEntry["DESCRIPTION"] || " ",
            notes: poDataEntry["COMMENTS"] || " ",
            received: poDataEntry["RECEIVED"] || " ",
            backorder: poDataEntry["B/O"] || " ",
          };

          try {
            // Send each record to the backend
            const apiResponse = await fetch("/api/purchasing", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(poPayload),
            });

            if (apiResponse.ok) {
              setImportStatus(`Row ${i} imported successfully`);
            } else {
              const errorDetails = await apiResponse.json();
              console.error(`Error importing row ${i}:`, errorDetails);
              setImportStatus(`Failed to import row ${i}`);
              break; // Stop processing on failure
            }
          } catch (error) {
            console.error(`Error importing row ${i}:`, error);
            setImportStatus(`Failed to import row ${i}`);
            break;
          }
        }
      } catch (error) {
        console.error("Error processing file:", error);
        setImportStatus("An error occurred while processing the file.");
      } finally {
        isProcessing.current = false; // Reset the processing state
      }
    };

    handleFileProcessing();
  }, []); // Ensure useEffect has an empty dependency array

  return (
    <div>
      <h1>Import PO Log</h1>
      <p>{importStatus}</p>
    </div>
  );
}
