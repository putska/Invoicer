//app/api/engineering/notes/route.ts
// API routes for managing engineering notes

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../../app/api/admin/helpers";
import {
  getCategoriesWithNotes,
  getActiveProjects,
} from "../../../../app/db/actions";

// Schema for validating query parameters
const querySchema = z.object({
  projectId: z.string().transform(Number),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      // If no projectId provided, return active projects
      const projects = await getActiveProjects();
      return NextResponse.json(
        { message: "Active projects retrieved successfully!", projects },
        { status: 200 }
      );
    }

    // Validate projectId
    const validatedQuery = querySchema.parse({ projectId });

    // Get categories with notes for the project
    const categories = await getCategoriesWithNotes(validatedQuery.projectId);

    return NextResponse.json(
      { message: "Engineering notes retrieved successfully!", categories },
      { status: 200 }
    );
  } catch (err) {
    console.error(err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: "An error occurred", error: errorMessage },
      { status: 400 }
    );
  }
}
