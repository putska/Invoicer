import { NextRequest, NextResponse } from "next/server";
import { getLaborDataByProject } from "../../../../db/actions";
import { authenticate, authorize } from "../../../admin/helpers";

// GET all labor data entries for a specific project (by job number)
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

    const laborData = await getLaborDataByProject(jobNumber);
    return laborData.length > 0
      ? NextResponse.json({
          message: "Labor data retrieved successfully!",
          laborData,
        })
      : NextResponse.json(
          { message: `No labor data found for job number: ${jobNumber}` },
          { status: 404 }
        );
  } catch (error) {
    console.error("Error fetching labor data by job number:", error);
    return NextResponse.json(
      { message: "Failed to retrieve labor data" },
      { status: 500 }
    );
  }
}
