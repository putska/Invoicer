// app/api/tokens/dropbox/route.ts
import { NextResponse } from "next/server";
import { DropboxAuth } from "dropbox";
import Redis from "ioredis";

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
  password: process.env.REDIS_PASSWORD,
});

export const dynamic = "force-dynamic";

export async function GET() {
  console.log("Dropbox token refresh started");
  const lockKey = "dropbox_token_refresh_lock";

  try {
    // 1. Acquire Lock
    const lockAcquired = await redisClient.set(lockKey, "1", "EX", 60, "NX"); // 60-second lock

    if (!lockAcquired) {
      return NextResponse.json(
        { message: "Token refresh in progress. Please try again later." },
        { status: 429 }
      ); // HTTP 429
    }

    try {
      // 2. Check Redis for existing token (inside the lock)
      const cachedToken = await redisClient.get("dropbox_access_token");
      const cachedExpiresAt = await redisClient.get("dropbox_expires_at");

      if (
        cachedToken &&
        cachedExpiresAt &&
        Date.now() < parseInt(cachedExpiresAt) - 300000 // 5-minute buffer
      ) {
        return NextResponse.json({
          accessToken: cachedToken,
          expiresAt: parseInt(cachedExpiresAt),
        });
      }

      // 3. Refresh token (only if necessary and lock acquired)
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

      await dbxAuth.refreshAccessToken();
      const newAccessToken = dbxAuth.getAccessToken();
      const newExpiresAt = dbxAuth.getAccessTokenExpiresAt()?.getTime();

      if (!newAccessToken || !newExpiresAt) {
        throw new Error("Failed to refresh Dropbox token");
      }

      // 4. Update Redis with new token and expiry (inside the lock)
      await redisClient.set(
        "dropbox_access_token",
        newAccessToken,
        "EX",
        (newExpiresAt - Date.now()) / 1000 - 300
      ); // Store with adjusted expiry
      await redisClient.set("dropbox_expires_at", newExpiresAt.toString()); // Store expiry separately

      return NextResponse.json({
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
      });
    } finally {
      // 5. Release Lock (always release in finally block)
      await redisClient.del(lockKey);
    }
  } catch (error) {
    console.error("Dropbox token refresh failed:", error);
    return NextResponse.json(
      { error: "Failed to get Dropbox access token" },
      { status: 500 }
    );
  }
}
