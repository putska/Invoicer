// app/api/shared-link/[...filePath]/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getDropboxClient,
  refreshAccessToken,
} from "../../../modules/dropbox/dropboxClient"; // Adjust the import path as needed

// In your shared link endpoint
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
      const existingLinks = await dbx.sharingListSharedLinks({
        path: filePath,
      });
      if (existingLinks.result.links.length > 0) {
        return Response.json({
          sharedLink: existingLinks.result.links[0].url.replace(
            "?dl=0",
            "?raw=1"
          ),
        });
      }
    } catch {} // Ignore if no links exist
    // Refresh access token if needed
    // Create new link if none found
    const response = await dbx.sharingCreateSharedLinkWithSettings({
      path: filePath,
      // settings: { requested_visibility: 'public' }
    });

    return Response.json({
      sharedLink: response.result.url.replace("?dl=0", "?raw=1"),
    });
  } catch (error) {
    console.error("Dropbox API error:", JSON.stringify(error, null, 2));
    return Response.json(
      { error: "Failed to generate shared link" },
      { status: 500 }
    );
  }
}
