import { NextResponse } from "next/server";
import { getToken, upsertToken } from "../../db/actions";
import { DropboxAuth } from "dropbox";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tokens = await getToken("dropbox");
    if (!tokens || tokens.length === 0) {
      return await refreshTokenAndStore(); // Refresh and store a new token
    }

    const token = tokens[0]; // Get the first token record

    const now = Date.now();
    const isValid = token.expiresAt > now + 300000; // 5-minute buffer

    if (isValid) {
      console.log("Returning cached token from database");
      return NextResponse.json(
        {
          accessToken: token.accessToken,
          expiresAt: token.expiresAt,
        },
        {
          headers: {
            "Cache-Control":
              "no-store, no-cache, must-revalidate, proxy-revalidate", // Most restrictive
            Pragma: "no-cache", // For older browsers
            Expires: "0", // For older browsers
          },
        }
      );
    }

    return await refreshTokenAndStore(); // Refresh and store a new token
  } catch (error) {
    console.error("Error getting/refreshing Dropbox token:", error);
    return NextResponse.json(
      { error: "Failed to get Dropbox access token" },
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

  const dbxAuth = new DropboxAuth({
    clientId,
    clientSecret,
    refreshToken,
    fetch,
  });

  try {
    await dbxAuth.refreshAccessToken();
    const newAccessToken = dbxAuth.getAccessToken();
    const newExpiresAt = dbxAuth.getAccessTokenExpiresAt()?.getTime();

    if (!newAccessToken || !newExpiresAt) {
      throw new Error("Failed to refresh Dropbox token");
    }

    await upsertToken("dropbox", {
      accessToken: newAccessToken,
      refreshToken: process.env.DROPBOX_REFRESH_TOKEN, // Store the refresh token
      expiresAt: newExpiresAt,
    });

    console.log("Token refreshed and stored in database");

    return NextResponse.json(
      {
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate", // Most restrictive
          Pragma: "no-cache", // For older browsers
          Expires: "0", // For older browsers
        },
      }
    );
  } catch (error) {
    console.error("Error refreshing token and storing in database:", error);
    throw error;
  }
}
