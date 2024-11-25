"use client";

import { useState } from "react";

export default function ImportLaborData() {
  const [importStatus, setImportStatus] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");

      // Extract headers from the first line
      const headers = lines[0].split(",");

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        const laborDataEntry = headers.reduce(
          (obj: Record<string, any>, header, index) => {
            obj[header.trim()] = values[index]?.trim();
            return obj;
          },
          {}
        );

        // Send each record to the backend
        const response = await fetch("/api/labor-data", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
            shift: laborDataEntry["Shift"],
            payType: laborDataEntry["Pay Type"],
            hours: parseFloat(laborDataEntry["Hours"]),
            startTime: laborDataEntry["Start Time"],
            endTime: laborDataEntry["End Time"],
            breaks: parseInt(laborDataEntry["Breaks"], 10),
            mealBreaks: parseInt(laborDataEntry["Meal Breaks"], 10),
            totalBreakTime: laborDataEntry["Total Break Time"],
            workLogName: laborDataEntry["Work Log Name"],
            payrollNotes: laborDataEntry["Payroll Notes"],
            payrollAttachments: laborDataEntry["Payroll Attachments"],
          }),
        });

        if (response.ok) {
          setImportStatus(`Row ${i} imported successfully`);
        } else {
          console.error(`Error importing row ${i}`);
          setImportStatus(`Failed to import row ${i}`);
          break;
        }
      }
    };

    reader.readAsText(file);
  };

  return (
    <div>
      <h1>Import Labor Data</h1>
      <input type="file" accept=".csv" onChange={handleFileChange} />
      <p>{importStatus}</p>
    </div>
  );
}
