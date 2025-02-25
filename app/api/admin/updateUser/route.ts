// /api/admin/updateUser/route.ts

import { NextRequest, NextResponse } from "next/server";
import { updateUser } from "../../../db/actions"; // adjust path accordingly
import { authenticate, authorize } from "../helpers"; // adjust path if needed

export async function POST(req: NextRequest) {
  try {
    // Authenticate the requester
    const user = await authenticate(req);
    if (!user) {
      console.error("Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only admins should update user records
    const isAuthorized = authorize(user, ["admin"]);
    if (!isAuthorized) {
      console.error("User lacks proper permissions");
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Parse the incoming request body
    const data = await req.json();

    // Validate required fields (you can add more robust validation here)
    if (
      !data.id ||
      !data.email ||
      !data.first_name ||
      !data.last_name ||
      !data.permission_level
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Update the user record in the database
    await updateUser(data);

    return NextResponse.json({ message: "User updated successfully!" });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "An error occurred while updating user" },
      { status: 500 }
    );
  }
}
