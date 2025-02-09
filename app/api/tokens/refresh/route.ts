import { NextResponse } from "next/server";
import { upsertToken } from "../../../db/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // Use GET for the refresh route
  try {
    return await refreshTokenAndStore();
  } catch (error) {
    console.error("Error triggering token refresh:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}

async function refreshTokenAndStore() {
  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Dropbox environment variables");
  }

  try {
    // const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/x-www-form-urlencoded",
    //   },
    //   body: new URLSearchParams({
    //     // Use URLSearchParams for correct encoding
    //     grant_type: "refresh_token",
    //     refresh_token: refreshToken,
    //     client_id: clientId,
    //     client_secret: clientSecret,
    //   }),
    // });
    const response = await fetch("https://api.dropboxapi.com/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=refresh_token&refresh_token=${refreshToken}&client_id=${clientId}&client_secret=${clientSecret}`,
    });

    if (!response.ok) {
      const errorData = await response.json(); // Get error details from Dropbox
      console.error("Dropbox API Error:", errorData); // Log the error
      throw new Error(
        `Failed to refresh Dropbox token: ${response.status} - ${response.statusText}`
      );
    }

    const data = await response.json();
    const newAccessToken = data.access_token;
    const newExpiresIn = data.expires_in; // Expires in seconds
    const newExpiresAt = Date.now() + newExpiresIn * 1000; // Calculate expiry timestamp

    if (!newAccessToken || !newExpiresAt) {
      throw new Error("Failed to refresh Dropbox token");
    }

    await upsertToken("dropbox", {
      accessToken: newAccessToken,
      refreshToken: refreshToken, // Store the refresh token
      expiresAt: newExpiresAt,
    });

    console.log("Token refreshed and stored in database", newExpiresAt);
    const date = new Date(newExpiresAt);
    console.log("Token expiry date:", date.toLocaleString());

    return NextResponse.json(
      {
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Error refreshing token and storing in database:", error);
    throw error;
  }
}
