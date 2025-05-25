import { NextRequest, NextResponse } from "next/server";
import { getGanttData } from "../../../db/actions";
import { authenticate } from "../../../../app/api/admin/helpers"; // Removed unused 'authorize'

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!start || !end) {
      return NextResponse.json(
        { message: "Start and end dates are required" },
        { status: 400 }
      );
    }

    const dateRange = {
      start: new Date(start),
      end: new Date(end),
    };

    const ganttData = await getGanttData(dateRange);
    return NextResponse.json({ ganttData });
  } catch (err) {
    console.error("Error fetching gantt data:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching gantt data" },
      { status: 500 }
    );
  }
}
