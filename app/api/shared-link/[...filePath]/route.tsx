import { NextResponse } from "next/server";
import { Dropbox } from "dropbox";
import { getDropboxClient } from "../../../modules/dropbox/dropboxClient";

export async function GET(
  request: Request,
  { params }: { params: { filePath: string[] } }
) {
  try {
    const dbx = await getDropboxClient();

    const cleanPath = params.filePath
      .join("/")
      .replace(/^\/+/, "") // Remove leading slashes
      .replace(/(%20| )/g, " ") // Convert %20 to spaces
      .replace(/'/g, "%27"); // Properly escape apostrophes

    const filePath = `/${cleanPath}`;

    // Handle existing shared links
    try {
      const listResponse = await dbx.sharingListSharedLinks({ path: filePath });
      if (listResponse.result.links.length > 0) {
        return NextResponse.json({
          sharedLink: listResponse.result.links[0].url.replace(
            "?dl=0",
            "?raw=1"
          ),
        });
      }
    } catch (error: any) {
      // Type the error for better handling
      console.error("Error checking existing shared links:", error);

      // Check if the error is due to an expired token.
      if (error.error && error.error[".tag"] === "expired_access_token") {
        // If the token is expired, re-throw the error or return an appropriate error response
        throw new Error("Dropbox access token expired. Please try again."); // Or return a 401
        // Or: return NextResponse.json({ error: "Token expired" }, { status: 401 });
      }
      // If it's some other error (e.g., file not found), *then* it's okay to proceed to creating a new link.
      // But you might want to handle other errors differently (e.g. 404 if the file doesn't exist).
    }

    // Create a new shared link if none exists
    const createResponse = await dbx.sharingCreateSharedLinkWithSettings({
      path: filePath,
    });

    return NextResponse.json({
      sharedLink: createResponse.result.url.replace("?dl=0", "?raw=1"),
    });
  } catch (error) {
    console.error("Dropbox API error:", error);
    return NextResponse.json(
      { error: "Failed to generate shared link" },
      { status: 500 }
    );
  }
}
