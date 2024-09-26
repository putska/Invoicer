import { NextRequest, NextResponse } from "next/server";
import { getSingleProject } from "@/app/db/actions";
import { authenticate, authorize } from "@/app/api/admin/helpers"; // Adjust the import path accordingly

export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  const projectName = req.nextUrl.searchParams.get("id");

  try {
    const project = await getSingleProject(projectName!);
    return NextResponse.json(
      { message: "Project retrieved successfully!", project },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "An error occurred", err },
      { status: 400 }
    );
  }
}
