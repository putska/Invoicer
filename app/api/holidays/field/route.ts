// app/api/holidays/field/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFieldHolidays } from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// GET field holidays
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

    const holidays = await getFieldHolidays(year);

    return NextResponse.json({
      message: "Field holidays retrieved successfully",
      holidays,
    });
  } catch (error) {
    console.error("Error fetching field holidays:", error);
    return NextResponse.json(
      { message: "Failed to retrieve field holidays" },
      { status: 500 }
    );
  }
}
