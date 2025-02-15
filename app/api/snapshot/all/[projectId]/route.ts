import { NextRequest, NextResponse } from "next/server";
import { getSnapshotsByProjectId } from "../../../../db/actions";
import { authenticate, authorize } from "../../../admin/helpers"; // Adjust the import path accordingly

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Authenticate the user
  const user = await authenticate(request);
  if (!user) return; // Response already sent in authenticate()
  try {
    const snapshots = await getSnapshotsByProjectId(Number(params.projectId));
    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Error fetching snapshots by projectId:", error);
    return NextResponse.json(
      { message: "Error fetching snapshots" },
      { status: 500 }
    );
  }
}
