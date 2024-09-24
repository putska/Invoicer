// app/api/getUser/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkId } from "@/app/db/actions";
import { User } from "@types"; // Adjust the path if needed

export async function POST(req: NextRequest) {
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
