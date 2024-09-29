// api/fieldMonitor/route.ts

import { getFieldMonitorData } from "../../../app/db/actions";
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly

export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  const projectId = parseInt(req.nextUrl.searchParams.get("projectId") || "0");

  if (!projectId) {
    return NextResponse.json({ message: "Invalid projectId" }, { status: 400 });
  }

  try {
    const data = await getFieldMonitorData(projectId);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error fetching monitor data", error: errorMessage },
      { status: 500 }
    );
  }
}
