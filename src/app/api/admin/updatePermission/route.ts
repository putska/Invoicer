// app/api/admin/updatePermission/route.ts

import { NextRequest, NextResponse } from "next/server";
import { updateUserPermission } from "../../../../app/db/actions";
import { authenticate, authorize } from "../../../../app/api/admin/helpers"; // Adjust the import path accordingly
import { PERMISSION_LEVELS } from "../../../../app/constants/permissions";

export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const { userId, permission_level } = body;
    console.log("userId", userId);
    console.log("permission_level", permission_level);
    // Ensure permission_level is valid
    if (!["read", "write", "admin"].includes(permission_level)) {
      return NextResponse.json(
        { message: "Invalid permission level" },
        { status: 400 }
      );
    }

    // Update user's permission level
    await updateUserPermission(userId, permission_level);

    return NextResponse.json({ message: "Permission updated successfully" });
  } catch (error) {
    console.error("Error in updatePermission API:", error);
    return NextResponse.json(
      { message: "Error updating permission", error },
      { status: 500 }
    );
  }
}
