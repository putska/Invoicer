// dropboxClient.ts
import { Dropbox } from "dropbox";

export async function getDropboxClient() {
  try {
    const dev = process.env.NODE_ENV !== "production";
    const baseUrl = dev ? "http://localhost:3000" : "https://cse-portal.com";

    const tokenUrl = `${baseUrl}/api/tokens`; // Correct URL
    console.log("tokenUrl: ", tokenUrl);
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

    return dbx;
  } catch (error) {
    console.error("Error getting Dropbox client:", error);
    throw error;
  }
}
