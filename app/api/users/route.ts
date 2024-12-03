import { NextRequest, NextResponse } from "next/server";
import { getAllUsers } from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";

// GET all users
export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate();
    if (!user) {
      console.error("Unauthorized access attempt");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Authorize the user
    const isAuthorized = authorize(user, ["admin", "read"]);
    if (!isAuthorized) {
      console.error("User lacks proper permissions");
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Fetch all users
    const users = await getAllUsers();
    console.log("Users retrieved successfully:", users);

    return NextResponse.json({
      message: "Users retrieved successfully!",
      users,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching users" },
      { status: 500 }
    );
  }
}
