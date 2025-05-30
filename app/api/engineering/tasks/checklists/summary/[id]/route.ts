import { NextRequest, NextResponse } from "next/server";
import { getChecklistSummaryByTaskId } from "../../../../../../db/actions";
import { authenticate } from "../../../../../../../app/api/admin/helpers"; // Removed unused 'authorize'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    const tasks = await getChecklistSummaryByTaskId(parseInt(params.id));
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Error fetching project tasks:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching project tasks" },
      { status: 500 }
    );
  }
}
