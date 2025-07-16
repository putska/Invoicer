// lib/holiday-utils.ts - Utility functions to replace hardcoded holidays

/**
 * Fetches holiday dates from the API for a specific type and year
 * @param type - The type of holidays to fetch ('office', 'field', or 'both')
 * @param year - Optional year to filter by
 * @returns Promise<string[]> - Array of holiday dates in YYYY-MM-DD format
 */
export async function getHolidayDates(
  type: "office" | "field" | "both",
  year?: number
): Promise<string[]> {
  try {
    const searchParams = new URLSearchParams();
    if (year) searchParams.append("year", year.toString());

    const response = await fetch(
      `/api/holidays/${type}?${searchParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch holidays`);
    }

    const result = await response.json();
    return result.holidays || [];
  } catch (error) {
    console.error("Error fetching holiday dates:", error);
    return [];
  }
}

/**
 * Gets office holidays for a specific year
 * Replaces your hardcoded holiday arrays for office schedules
 * @param year - Optional year to filter by
 * @returns Promise<string[]> - Array of office holiday dates
 */
export async function getOfficeHolidayDates(year?: number): Promise<string[]> {
  return getHolidayDates("office", year);
}

/**
 * Gets field holidays for a specific year
 * For field manpower schedules and field operations
 * @param year - Optional year to filter by
 * @returns Promise<string[]> - Array of field holiday dates
 */
export async function getFieldHolidayDates(year?: number): Promise<string[]> {
  return getHolidayDates("field", year);
}

/**
 * Gets company-wide holidays (applies to both office and field)
 * @param year - Optional year to filter by
 * @returns Promise<string[]> - Array of company holiday dates
 */
export async function getAllCompanyHolidays(year?: number): Promise<string[]> {
  return getHolidayDates("both", year);
}

/**
 * Checks if a specific date is a holiday for the given type
 * @param date - Date string in YYYY-MM-DD format
 * @param type - Holiday type to check against
 * @param year - Optional year for optimization
 * @returns Promise<boolean> - True if the date is a holiday
 */
export async function isHoliday(
  date: string,
  type: "office" | "field" | "both",
  year?: number
): Promise<boolean> {
  const holidays = await getHolidayDates(type, year);
  return holidays.includes(date);
}

/**
 * Gets upcoming holidays within a specified number of days
 * Useful for dashboard widgets or notifications
 * @param type - Holiday type to check
 * @param daysAhead - Number of days to look ahead (default: 30)
 * @returns Promise<string[]> - Array of upcoming holiday dates
 */
export async function getUpcomingHolidays(
  type: "office" | "field" | "both",
  daysAhead: number = 30
): Promise<string[]> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + daysAhead);

  const holidays = await getHolidayDates(type);

  return holidays.filter((holiday) => {
    const holidayDate = new Date(holiday);
    return holidayDate >= today && holidayDate <= futureDate;
  });
}

/**
 * Gets holidays within a specific date range
 * @param type - Holiday type to fetch
 * @param startDate - Start date in YYYY-MM-DD format
 * @param endDate - End date in YYYY-MM-DD format
 * @returns Promise<string[]> - Array of holiday dates in the range
 */
export async function getHolidaysInRange(
  type: "office" | "field" | "both",
  startDate: string,
  endDate: string
): Promise<string[]> {
  try {
    const searchParams = new URLSearchParams({
      type,
      startDate,
      endDate,
    });

    const response = await fetch(`/api/holidays?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch holidays`);
    }

    const result = await response.json();
    return (result.holidays || []).map((holiday: any) => holiday.date);
  } catch (error) {
    console.error("Error fetching holidays in range:", error);
    return [];
  }
}

/**
 * Counts holidays for a specific type and year
 * @param type - Holiday type to count
 * @param year - Year to count holidays for
 * @returns Promise<number> - Number of holidays
 */
export async function countHolidays(
  type: "office" | "field" | "both",
  year?: number
): Promise<number> {
  const holidays = await getHolidayDates(type, year);
  return holidays.length;
}

/**
 * Gets the next holiday after a given date
 * @param type - Holiday type to check
 * @param afterDate - Date to check after (default: today)
 * @returns Promise<string | null> - Next holiday date or null if none found
 */
export async function getNextHoliday(
  type: "office" | "field" | "both",
  afterDate?: string
): Promise<string | null> {
  const checkDate = afterDate || new Date().toISOString().split("T")[0];
  const holidays = await getHolidayDates(type);

  const futureHolidays = holidays.filter((holiday) => holiday > checkDate);
  futureHolidays.sort();

  return futureHolidays.length > 0 ? futureHolidays[0] : null;
}

/**
 * Usage Examples:
 *
 * // Replace your hardcoded arrays:
 * const holidays = [
 *   "2024-12-23",
 *   "2024-12-24",
 *   // ... etc
 * ];
 *
 * // With API calls:
 * const officeHolidays = await getOfficeHolidayDates(2024);
 * const fieldHolidays = await getFieldHolidayDates(2024);
 *
 * // Check if a specific date is a holiday:
 * const isDecember25Holiday = await isHoliday('2024-12-25', 'office');
 *
 * // Get upcoming holidays for dashboard:
 * const upcoming = await getUpcomingHolidays('office', 14); // Next 2 weeks
 *
 * // Count holidays for reporting:
 * const totalOfficeHolidays = await countHolidays('office', 2024);
 */
