import { NextRequest, NextResponse } from "next/server";
import { getLaborDataByCostCode } from "../../../../../../db/actions";
import { authenticate, authorize } from "../../../../../admin/helpers";

// GET breakdown of labor by cost code for a project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; costCode: string } }
) {
  const { id: jobNumber, costCode } = params;

  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "read"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const laborData = await getLaborDataByCostCode(jobNumber, costCode);
    return laborData.length > 0
      ? NextResponse.json({
          message: "Labor data by cost code retrieved successfully!",
          laborData,
        })
      : NextResponse.json(
          { message: `No labor data found for cost code: ${costCode}` },
          { status: 404 }
        );
  } catch (error) {
    console.error("Error fetching labor data by cost code:", error);
    return NextResponse.json(
      { message: "Failed to retrieve labor data by cost code" },
      { status: 500 }
    );
  }
}
