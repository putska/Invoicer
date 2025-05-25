import { NextRequest, NextResponse } from "next/server";
import { getScheduleData } from "../../../db/actions";
import { authenticate } from "../../../../app/api/admin/helpers"; // Removed unused 'authorize'

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    const scheduleData = await getScheduleData();
    return NextResponse.json({ scheduleData });
  } catch (err) {
    console.error("Error fetching schedule data:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching schedule data" },
      { status: 500 }
    );
  }
}
