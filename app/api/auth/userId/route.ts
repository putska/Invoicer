// src/app/api/auth/userId/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "../../admin/helpers";
import { requestFormReset } from "react-dom";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserId(req); // Use the server-side helper to fetch userId
    return NextResponse.json({ userId }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user ID:", error.message);
    return NextResponse.json(
      { message: error.message },
      { status: error.message.includes("Unauthorized") ? 401 : 500 }
    );
  }
}
