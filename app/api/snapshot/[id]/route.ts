// /api/snapshot/[id]/route.ts

import { NextResponse } from "next/server";
import { getSnapshotById } from "../../../db/actions";
import { authenticate, authorize } from "../../../../app/api/admin/helpers"; // Adjust the import path accordingly

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const snapshotId = params.id;

    if (!snapshotId) {
      return NextResponse.json(
        { message: "Missing required parameter: snapshotId" },
        { status: 400 }
      );
    }

    const snapshot = await getSnapshotById(snapshotId);

    if (!snapshot) {
      return NextResponse.json(
        { message: "Snapshot not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(snapshot, { status: 200 });
  } catch (error) {
    console.error("Error retrieving snapshot:", error);
    return NextResponse.json(
      { message: "Failed to retrieve snapshot" },
      { status: 500 }
    );
  }
}
