import { deleteProject, addProject, getProjects } from "@/app/db/actions";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, authorize } from "@/app/api/admin/helpers"; // Adjust the import path accordingly
import {
  PERMISSION_LEVELS,
  PermissionLevel,
} from "@/app/constants/permissions";

// Define a schema for validating incoming project data
const projectSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // Example regex for ISO date format
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  status: z.string().optional().default("active"),
});

export async function POST(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()
  try {
    const body = await req.json();
    const projectData = projectSchema.parse(body); // Validate incoming data

    const newProject = await addProject({
      name: projectData.name,
      description: projectData.description || "",
      startDate: projectData.startDate,
      endDate: projectData.endDate || undefined,
      status: projectData.status || "active",
    });

    return NextResponse.json(
      { message: "New Project Created!", id: newProject.id },
      { status: 201 }
    );
  } catch (err) {
    console.error(err); // Log the error for debugging
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: "An error occurred", error: errorMessage },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  try {
    const projects = await getProjects(); // Fetch all projects
    if (!projects || projects.length === 0) {
      return NextResponse.json(
        { message: "No projects found" },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { message: "Projects retrieved successfully!", projects },
      { status: 200 }
    );
  } catch (err) {
    console.error(err); // Log the error for debugging
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: "An error occurred", error: errorMessage },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  const projectID = req.nextUrl.searchParams.get("id");

  if (!projectID) {
    return NextResponse.json(
      { message: "Missing id parameter" },
      { status: 400 }
    );
  }

  try {
    await deleteProject(Number(projectID));
    return NextResponse.json({ message: "Project deleted!" }, { status: 200 });
  } catch (err) {
    console.error(err); // Log the error for debugging
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: "An error occurred", error: errorMessage },
      { status: 400 }
    );
  }
}
