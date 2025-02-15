// app/api/createUser/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkId, createUser } from "../../../app/db/actions";
import { User } from "../../types"; // Assuming this is the correct path to your types
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly

export async function POST(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) return; // Response already sent in authenticate()

  const { clerk_id, email, first_name, last_name, permission_level } =
    await req.json();

  // Ensure necessary fields are present
  if (!clerk_id || !email || !first_name || !last_name || !permission_level) {
    return NextResponse.json(
      { message: "Missing required fields" },
      { status: 400 }
    );
  }

  try {
    // Try to fetch user by clerk_id
    const user = await getUserByClerkId(clerk_id);

    if (!user) {
      // If the user is not found, create a new one
      try {
        const newUser: User = await createUser({
          clerk_id,
          email,
          first_name,
          last_name,
          permission_level: "read", // Or any default value you'd like
        });

        return NextResponse.json(
          { message: "New User Created!", newUser },
          { status: 201 }
        );
      } catch (err) {
        console.error("Error creating user:", err);
        return NextResponse.json(
          { message: "Failed to create user", error: err },
          { status: 500 }
        );
      }
    }

    // User found
    return NextResponse.json(
      { message: "User already exists!", user },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error retrieving user:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching user", error: err },
      { status: 500 }
    );
  }
}
