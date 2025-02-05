// src/app/api/tokens/route.ts
import { NextResponse } from "next/server";
import { getToken, upsertToken } from "../../db/actions";

export async function GET() {
  try {
    const token = await getToken("dropbox");
    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error retrieving token:", error);
    return NextResponse.json(
      { error: "Failed to retrieve token" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Expecting body to have: { accessToken, refreshToken?, expiresAt }
    await upsertToken("dropbox", {
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
      expiresAt: body.expiresAt,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error upserting token:", error);
    return NextResponse.json(
      { error: "Failed to update token" },
      { status: 500 }
    );
  }
}
