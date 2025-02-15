import { NextRequest, NextResponse } from "next/server";
import { getManpowerByProjectId } from "../../../db/actions";
import { authenticate, authorize } from "../../../../app/api/admin/helpers"; // Adjust the import path accordingly

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
): Promise<NextResponse> {
  const { projectId } = params;

  if (!projectId) {
    return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
  }

  try {
    const manpowerRecords = await getManpowerByProjectId(Number(projectId));
    return NextResponse.json({ manpower: manpowerRecords }, { status: 200 });
  } catch (error) {
    console.error("Error fetching manpower records:", error);
    return NextResponse.json(
      { error: "Failed to fetch manpower records" },
      { status: 500 }
    );
  }
}
