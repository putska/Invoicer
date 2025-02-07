// dropboxClient.ts
import { Dropbox } from "dropbox";
import { DropboxAuth } from "dropbox";

// let accessToken: string | null = null; // Store access token in memory
// let accessTokenExpiry: number | null = null; // Store expiry timestamp

// export async function getDropboxAccessToken(): Promise<string> {
//   // Return type added
//   if (accessToken && accessTokenExpiry && Date.now() < accessTokenExpiry) {
//     return accessToken; // Return cached access token if valid
//   }

//   const clientId = process.env.DROPBOX_APP_KEY;
//   const clientSecret = process.env.DROPBOX_APP_SECRET;
//   const refreshToken = process.env.DROPBOX_REFRESH_TOKEN;

//   if (!clientId || !clientSecret || !refreshToken) {
//     throw new Error("Missing Dropbox environment variables");
//   }

//   const dbxAuth = new DropboxAuth({
//     // Use DropboxAuth for refresh
//     clientId,
//     clientSecret,
//     refreshToken,
//     fetch,
//   });

//   try {
//     await dbxAuth.refreshAccessToken(); // Use refreshAccessToken
//     accessToken = dbxAuth.getAccessToken();
//     const expiresAt = dbxAuth.getAccessTokenExpiresAt();
//     accessTokenExpiry = expiresAt ? expiresAt.getTime() : null; // Store expiry

//     console.log("New Dropbox access token obtained:", accessToken); // Log for debugging (remove in production)
//     console.log("Token expires at:", accessTokenExpiry); // Log for debugging (remove in production)

//     return accessToken; // Return new access token
//   } catch (error) {
//     console.error("Error refreshing Dropbox token:", error);
//     throw error; // Re-throw the error for handling in the calling function
//   }
// }

export async function getDropboxClient() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const tokenUrl = `${baseUrl}/api/tokens`; // Correct URL

    const response = await fetch(tokenUrl);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to get Dropbox token: ${response.status} - ${errorText}`
      );
    }

    const data = await response.json();
    const accessToken = data.accessToken;
    const expiresAt = data.expiresAt;

    if (!accessToken) {
      throw new Error("Access token is not available.");
    }

    const dbx = new Dropbox({ accessToken, fetch });

    //old code that I know works
    //const dbx = new Dropbox({
    //  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
    //accessToken: await getDropboxAccessToken(),
    //  fetch,
    //});

    return dbx;
  } catch (error) {
    console.error("Error getting Dropbox client:", error);
    throw error;
  }
}
