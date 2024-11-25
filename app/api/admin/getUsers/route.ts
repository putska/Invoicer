// app/api/admin/getUsers/route.ts

import { NextResponse } from "next/server";
import { getAllUsers } from "../../../../app/db/actions";
import { cookies } from "next/headers";
import { authenticate, authorize } from "../../../../app/api/admin/helpers"; // Adjust the import path accordingly
import { PERMISSION_LEVELS } from "../../../../app/constants/permissions";

export async function GET() {
  cookies();
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
    const users = await getAllUsers();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error in getAllUsers API:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
