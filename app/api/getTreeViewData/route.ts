import { NextRequest, NextResponse } from "next/server";
import { getTreeViewData } from "../../../app/db/actions"; // Adjust the import path as necessary
import { authenticate } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly

export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { message: "Missing projectId parameter" },
      { status: 400 }
    );
  }

  try {
    const treeViewData = await getTreeViewData(Number(projectId));
    return NextResponse.json(
      { message: "Data retrieved successfully!", treeViewData },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching tree view data:", err);
    return NextResponse.json(
      {
        message: "An error occurred",
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
