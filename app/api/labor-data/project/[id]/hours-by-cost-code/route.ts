import { NextRequest, NextResponse } from "next/server";
import { getTotalHoursGroupedByCostCode } from "../../../../../db/actions";
import { authenticate, authorize } from "../../../../admin/helpers";

// GET total hours grouped by cost code for a specific project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobNumber = params.id;

  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "read"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const hoursByCostCode = await getTotalHoursGroupedByCostCode(jobNumber);
    return NextResponse.json({
      message: "Hours grouped by cost code retrieved successfully!",
      hoursByCostCode,
    });
  } catch (error) {
    console.error("Error fetching hours by cost code:", error);
    return NextResponse.json(
      { message: "Failed to retrieve hours by cost code" },
      { status: 500 }
    );
  }
}
