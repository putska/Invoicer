// bulk_import_script.js

import fs from "fs";
import csv from "csv-parser";
import { db } from "./src/app/db/lib/drizzle.js"; // Update with the correct path to your db setup
import { laborData } from "./src/app/db/schema.js"; // Update with the correct path to your schema
import "dotenv/config"; // Make sure this is at the top of the file

// Path to your CSV file
const csvFilePath = "c:/dev/import.csv";

// Function to import data from CSV to the database
async function importLaborData() {
  try {
    const records = [];

    // Parse the CSV file
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        // Map CSV row data to the correct fields in your database
        const record = {
          lastName: row["Last Name"] || "",
          firstName: row["First Name"] || "",
          eid: parseInt(row["EID"]) || null,
          day: row["Day"] || "",
          date: row["Date"] || "",
          projectName: row["Project Name"] || "",
          jobNumber: row["Job #"] || "",
          costCodeDivision: row["Cost Code Division"] || "",
          costCodeNumber: row["Cost Code #"] || "",
          costCodeDescription: row["Cost Code Description"] || "",
          classification: row["Classification"] || "",
          shift: row["Shift"] || "",
          payType: row["Pay Type"] || "",
          hours: parseFloat(row["Hours"]) || 0,
          startTime: row["Start Time"] || "",
          endTime: row["End Time"] || "",
          breaks: parseInt(row["Breaks"]) || 0,
          mealBreaks: parseInt(row["Meal Breaks"]) || 0,
          totalBreakTime: row["Total Break Time"] || "",
          workLogName: row["WorkLog Name"] || "",
          payrollNotes: row["Payroll Notes"] || "",
          payrollAttachments: row["Payroll Attachments"] || "",
        };
        records.push(record); // Collect each record
      })
      .on("end", async () => {
        console.log("CSV parsing complete");

        try {
          // Insert all records at once if batch insertion is supported
          await db.insert(laborData).values(records);
          console.log("Data imported successfully!");
        } catch (error) {
          console.error("Error inserting records:", error);
        }
      });
  } catch (error) {
    console.error("Error importing data:", error);
  }
}

// Run the import function
importLaborData();
