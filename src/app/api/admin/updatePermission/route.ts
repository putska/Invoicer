// app/api/admin/updatePermission/route.ts

import { NextRequest, NextResponse } from "next/server";
import { updateUserPermission } from "@/app/db/actions";

export async function POST(req: NextRequest) {
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
