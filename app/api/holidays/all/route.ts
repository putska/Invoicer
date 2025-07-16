// app/api/holidays/all/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllHolidays } from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// GET all company holidays (both office and field)
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

    const holidays = await getAllHolidays(year);

    return NextResponse.json({
      message: "Company holidays retrieved successfully",
      holidays,
    });
  } catch (error) {
    console.error("Error fetching company holidays:", error);
    return NextResponse.json(
      { message: "Failed to retrieve company holidays" },
      { status: 500 }
    );
  }
}
