import { NextRequest, NextResponse } from "next/server";
import { getSingleProject } from "@/app/db/actions";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  try {
    const project = await getSingleProject(projectId);
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
