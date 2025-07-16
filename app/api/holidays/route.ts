// app/api/holidays/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getHolidays, createHoliday } from "../../db/actions";
import type {
  CreateHolidayRequest,
  GetHolidaysRequest,
  HolidayType,
} from "../../types";
import { authenticate, authorize } from "../admin/helpers";

// GET all holidays
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "read"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;

    const filters: GetHolidaysRequest = {
      type: searchParams.get("type") as HolidayType | undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      year: searchParams.get("year")
        ? parseInt(searchParams.get("year")!)
        : undefined,
    };

    const result = await getHolidays(filters);

    if (result.success) {
      return NextResponse.json({
        message: "Holidays retrieved successfully",
        holidays: result.holidays,
      });
    } else {
      return NextResponse.json(
        { message: result.error || "Failed to retrieve holidays" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error fetching holidays:", error);
    return NextResponse.json(
      { message: "Failed to retrieve holidays" },
      { status: 500 }
    );
  }
}

// POST: Add a new holiday
export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const holidayData: CreateHolidayRequest = await req.json();
    const result = await createHoliday(holidayData);

    if (result.success) {
      return NextResponse.json(
        {
          message: "Holiday added successfully",
          holiday: result.holiday,
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { message: result.error || "Failed to add holiday" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error adding holiday:", error);
    return NextResponse.json(
      { message: "Failed to add holiday" },
      { status: 500 }
    );
  }
}
