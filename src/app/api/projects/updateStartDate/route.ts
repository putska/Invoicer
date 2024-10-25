import { NextRequest, NextResponse } from "next/server";
import {
  getProjectStartDate,
  getManpowerByProjectId,
  updateProjectStartDate,
  updateManpowerDate,
} from "../../../db/actions";
import { addDays, parseISO } from "date-fns";

export async function PUT(req: NextRequest) {
  try {
    const { projectId, newStartDate } = await req.json();

    if (!projectId || !newStartDate) {
      return NextResponse.json(
        { error: "Missing projectId or newStartDate" },
        { status: 400 }
      );
    }

    const holidays = [
      "2024-12-23", // DDO
      "2024-12-24", // Christmas Eve
      "2024-12-25", // Christmas
      "2024-11-11", // Veterans Day
      "2024-11-28", // Thanksgiving
      "2024-11-29", // Day after Thanksgiving
      "2025-01-01", // New Year
      "2025-01-20", // MLK Day
      "2025-02-10", // DDO
      "2025-02-17", // Presidents Day
      "2025-04-18", // DDO
      "2025-05-23", // DDO
      "2025-05-26", // Memorial Day
      "2025-07-04", // Independence Day
      "2025-07-07", // DDO
      "2025-08-29", // DDO
      "2025-09-01", // Labor Day
      "2025-11-11", // Veterans Day
      "2025-11-27", // Thanksgiving
      "2025-11-28", // Day after Thanksgiving
      "2025-12-25", // Christmas
      "2025-12-26", // Christmas Day
      "2026-01-01", // New Year
      "2026-01-02", // DDO
      "2026-01-19", // MLK Day
      "2026-02-09", // DDO
      "2026-02-16", // Presidents Day
      "2026-04-03", // DDO
      "2026-05-25", // Memorial Day
      "2026-06-19", // Junteenth
      "2026-07-03", // Independence Day
      "2026-07-06", // DDO
      "2026-08-07", // DDO
      "2026-09-04", // DDO
      "2026-09-07", // Labor Day
      "2026-11-11", // Veterans Day
      "2026-11-26", // Thanksgiving
      "2026-11-27", // Day after Thanksgiving
      "2026-12-24", // Christmas Eve
      "2026-12-25", // Christmas
      "2027-01-01", // New Year
      "2027-01-18", // MLK Day
      "2027-02-15", // Presidents Day
      "2027-03-26", // DDO
      "2027-05-31", // Memorial Day
      "2027-05-28", // DDO
      "2027-06-18", // Junteenth
      "2027-07-05", // Independence Day
      "2027-07-08", // DDO
    ].map((dateStr) => new Date(dateStr));

    // Get the old start date, normalized to UTC start of day
    const oldStartDateStr = await getProjectStartDate(projectId);
    if (!oldStartDateStr) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    const oldStartDate = startOfUTCDay(parseISO(oldStartDateStr));
    const newStartDateObj = startOfUTCDay(parseISO(newStartDate));

    // Calculate the number of working days between the old and new start dates
    const N = calculateWorkingDays(oldStartDate, newStartDateObj, holidays);

    // Update the project's start date
    await updateProjectStartDate(projectId, newStartDate);

    // Fetch all manpower records for the project
    const manpowerRecords = await getManpowerByProjectId(projectId);

    // Update the date for each manpower record
    for (const record of manpowerRecords) {
      const oldDate = startOfUTCDay(parseISO(record.date));
      //console.log("Old Date:", oldDate.toISOString());
      //console.log("Working Days Difference (N):", N);

      // Shift the date by N working days
      const newDate = shiftDate(oldDate, N, holidays);
      //console.log("New Date after shifting:", newDate.toISOString());

      // Update the manpower record with the new date
      await updateManpowerDate(record.manpowerId, newDate);
    }

    return NextResponse.json(
      {
        message: "Project start date and manpower records updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating project start date:", error);
    return NextResponse.json(
      { error: "Failed to update project start date" },
      { status: 500 }
    );
  }
}

// Function to reset date to start of UTC day
const startOfUTCDay = (date: Date): Date => {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
};

// Function to check if two dates are the same UTC day
const isSameUTCDay = (dateLeft: Date, dateRight: Date): boolean => {
  return (
    dateLeft.getUTCFullYear() === dateRight.getUTCFullYear() &&
    dateLeft.getUTCMonth() === dateRight.getUTCMonth() &&
    dateLeft.getUTCDate() === dateRight.getUTCDate()
  );
};

// Function to check if a date is a holiday
const isHoliday = (date: Date, holidays: Date[]): boolean => {
  const dateToCompare = startOfUTCDay(date);
  return holidays.some((holiday) => isSameUTCDay(dateToCompare, holiday));
};

// Function to check if a date is a weekend (Saturday or Sunday)
const isWeekendUTC = (date: Date): boolean => {
  const day = date.getUTCDay(); // Sunday is 0, Monday is 1, ..., Saturday is 6
  return day === 0 || day === 6;
};

// Corrected function to calculate the number of working days between two dates
const calculateWorkingDays = (
  startDate: Date,
  endDate: Date,
  holidays: Date[]
): number => {
  let workingDays = 0;
  const direction = startDate <= endDate ? 1 : -1;
  let currentDate = startOfUTCDay(startDate);

  while (!isSameUTCDay(currentDate, endDate)) {
    currentDate = addDays(currentDate, direction);

    // Skip weekends and holidays
    if (isWeekendUTC(currentDate) || isHoliday(currentDate, holidays)) {
      continue;
    }

    workingDays += 1;
  }

  // Multiply by direction to get a negative value when moving backward
  return workingDays * direction;
};

// Corrected function to shift a date by N working days
const shiftDate = (date: Date, N: number, holidays: Date[]): Date => {
  let shiftedDate = startOfUTCDay(date);
  const direction = N >= 0 ? 1 : -1;
  let workingDaysShifted = 0;

  while (workingDaysShifted < Math.abs(N)) {
    shiftedDate = addDays(shiftedDate, direction);

    // Skip weekends and holidays
    if (isWeekendUTC(shiftedDate) || isHoliday(shiftedDate, holidays)) {
      continue;
    }

    workingDaysShifted += 1;
  }

  return shiftedDate;
};
