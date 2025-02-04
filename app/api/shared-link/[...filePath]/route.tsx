// app/api/shared-link/[...filePath]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDropboxClient } from "../../../modules/dropbox/dropboxClient"; // Adjust the import path as needed

export async function GET(
  req: NextRequest,
  { params }: { params: { filePath: string[] } }
) {
  // Reconstruct the file path from the catch-all parameter array
  const filePath = "/" + params.filePath.join("/");

  try {
    const dbx = await getDropboxClient();
    const response = await dbx.sharingCreateSharedLinkWithSettings({
      path: filePath,
    });
    // Modify the URL to force a download, if that's what you want
    const sharedLink = response.result.url.replace("dl=0", "dl=1");
    return NextResponse.json({ sharedLink });
  } catch (error) {
    console.error("Error generating shared link:", error);
    return NextResponse.json(
      { error: "Failed to generate shared link" },
      { status: 500 }
    );
  }
}
