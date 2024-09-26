// app/api/getUser/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkId } from "@/app/db/actions";
import { User } from "@types"; // Adjust the path if needed
import { authenticate, authorize } from "@/app/api/admin/helpers"; // Adjust the import path accordingly
import {
  PERMISSION_LEVELS,
  PermissionLevel,
} from "@/app/constants/permissions";

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

  const { clerk_id } = await req.json();

  // Ensure necessary fields are present
  if (!clerk_id) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Try to fetch user by clerk_id
    const user = await getUserByClerkId(clerk_id);

    // If the user is not found, return a 404 response
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // If the user is found, return the user data
    return NextResponse.json(user, { status: 200 });
  } catch (err) {
    console.error("Error retrieving user:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching user", error: err },
      { status: 500 }
    );
  }
}
