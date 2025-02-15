// /api/snapshot/route.ts

import { NextResponse } from "next/server";
import { storeSnapshot } from "../../db/actions";
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly
import {
  PERMISSION_LEVELS,
  PermissionLevel,
} from "../../../app/constants/permissions";

export async function POST(req: Request) {
  try {
    const { projectId, snapshotData } = await req.json();

    if (!projectId || !snapshotData) {
      return NextResponse.json(
        { message: "Missing required fields: projectId or snapshotData" },
        { status: 400 }
      );
    }

    const snapshotId = await storeSnapshot(projectId, snapshotData);
    return NextResponse.json(
      { message: "Snapshot stored successfully", snapshotId },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error storing snapshot:", error);
    return NextResponse.json(
      { message: "Failed to store snapshot" },
      { status: 500 }
    );
  }
}
