// src/app/api/auth/userId/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../admin/helpers"; // Use authenticate instead of getUserId

export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req); // This returns the full user object

    // Check if authenticate returned a NextResponse (error case)
    if (user instanceof NextResponse) {
      return user;
    }

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Return user info including permission level
    return NextResponse.json(
      {
        userId: user.id,
        permission_level: user.permission_level,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching user info:", error.message);
    return NextResponse.json(
      { message: error.message },
      { status: error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
