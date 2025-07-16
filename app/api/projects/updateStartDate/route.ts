import { NextRequest, NextResponse } from "next/server";
import {
  getProjectStartDate,
  getManpowerByProjectId,
  updateProjectStartDate,
  updateManpowerDate,
  getFieldHolidays,
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

    // Get field holidays from your holiday management system
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const prevYear = currentYear - 1;

    // Get holidays for current year and adjacent years to handle cross-year projects
    const [currentYearHolidays, nextYearHolidays, prevYearHolidays] =
      await Promise.all([
        getFieldHolidays(currentYear),
        getFieldHolidays(nextYear),
        getFieldHolidays(prevYear),
      ]);

    const holidayStrings = [
      ...prevYearHolidays,
      ...currentYearHolidays,
      ...nextYearHolidays,
    ];
    const holidays = holidayStrings.map((dateStr) => new Date(dateStr));

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
