// src/app/api/users/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserByClerkId } from "@/app/db/actions";
import { cookies } from "next/headers";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    cookies();
    const user = await getUserByClerkId(params.id);

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching user" },
      { status: 500 }
    );
  }
}
