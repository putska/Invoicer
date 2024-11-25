import { NextRequest, NextResponse } from "next/server";
import { getTotalHoursByProject } from "../../../../../db/actions";
import { authenticate, authorize } from "../../../../admin/helpers";

// GET total hours for a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobNumber = params.id;

  try {
    const user = await authenticate();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "read"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const totalHours = await getTotalHoursByProject(jobNumber);
    return NextResponse.json({
      message: "Total hours retrieved successfully!",
      totalHours,
    });
  } catch (error) {
    console.error("Error fetching total hours by project:", error);
    return NextResponse.json(
      { message: "Failed to retrieve total hours" },
      { status: 500 }
    );
  }
}
