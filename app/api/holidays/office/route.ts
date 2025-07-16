// app/api/holidays/office/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getOfficeHolidays } from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// GET office holidays
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
    const year = searchParams.get("year")
      ? parseInt(searchParams.get("year")!)
      : undefined;

    const holidays = await getOfficeHolidays(year);

    return NextResponse.json({
      message: "Office holidays retrieved successfully",
      holidays,
    });
  } catch (error) {
    console.error("Error fetching office holidays:", error);
    return NextResponse.json(
      { message: "Failed to retrieve office holidays" },
      { status: 500 }
    );
  }
}
