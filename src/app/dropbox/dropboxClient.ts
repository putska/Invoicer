import { Dropbox, DropboxAuth } from "dropbox";

let cachedAccessToken: string | null = null;
let accessTokenExpiresAt = 0;

interface TokenData {
  access_token: string;
  expires_in: number;
}

export async function refreshAccessToken() {
  const clientId = process.env.DROPBOX_APP_KEY;
  const clientSecret = process.env.DROPBOX_APP_SECRET;
  const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

  // Check for missing credentials
  if (!clientId || !clientSecret || !refreshToken) {
    console.error("Missing Dropbox environment variables.");
    throw new Error(
      "Dropbox credentials are not fully set in environment variables."
    );
  }

  const dbxAuth = new DropboxAuth({
    clientId,
    clientSecret,
    refreshToken,
    fetch,
  });

  try {
    // Refresh the access token
    await dbxAuth.refreshAccessToken();
    console.log("Token data: ", dbxAuth); // Remove in production
    // Access the updated access token and expiration time from dbxAuth
    cachedAccessToken = dbxAuth.getAccessToken();
    const expiresAtDate = dbxAuth.getAccessTokenExpiresAt();
    accessTokenExpiresAt = expiresAtDate ? expiresAtDate.getTime() : 0;
    if (!cachedAccessToken) {
      throw new Error("Failed to obtain access token.");
    }
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    throw error;
  }
}

export async function getDropboxClient() {
  if (!cachedAccessToken || Date.now() >= accessTokenExpiresAt) {
    await refreshAccessToken();
  }

  if (!cachedAccessToken) {
    throw new Error("Access token is not available.");
  }

  const dbx = new Dropbox({
    accessToken: cachedAccessToken,
    fetch,
  });

  return dbx;
}
