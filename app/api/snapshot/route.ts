// /api/snapshot/route.ts

import { NextResponse } from "next/server";
import { storeSnapshot } from "../../db/actions";
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly
import {
  PERMISSION_LEVELS,
  PermissionLevel,
} from "../../../app/constants/permissions";

export async function POST(req: Request) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

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
