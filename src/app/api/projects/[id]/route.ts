import { NextRequest, NextResponse } from "next/server";
import { getSingleProject, updateProject } from "@/app/db/actions";
import { Project } from "@types";

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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = parseInt(params.id, 10);

  try {
    const updatedProject = await req.json();

    // Validate date strings
    const dateFields = ["startDate", "endDate"];
    for (const field of dateFields) {
      if (updatedProject[field]) {
        const date = new Date(updatedProject[field]);
        if (isNaN(date.getTime())) {
          console.error(`Invalid ${field}:`, updatedProject[field]);
          delete updatedProject[field]; // Remove invalid date
        }
      }
    }

    // Exclude fields that should not be updated
    const allowedFields = [
      "name",
      "description",
      "startDate",
      "endDate",
      "status",
    ];
    const updatedData: Partial<Project> = {};

    for (const key of allowedFields) {
      if (updatedProject[key] !== undefined) {
        updatedData[key] = updatedProject[key];
      }
    }

    const result = await updateProject(projectId, updatedData);
    return NextResponse.json(
      { message: "Project updated successfully!", result },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating project:", err);
    return NextResponse.json(
      { message: "An error occurred", err },
      { status: 400 }
    );
  }
}
