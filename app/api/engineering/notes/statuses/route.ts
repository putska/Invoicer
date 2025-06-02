//app/api/engineering/notes/statuses/route.ts
// API routes for managing custom note statuses

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../../../app/api/admin/helpers";
import {
  getStatusesForProject,
  addNoteStatus,
  reorderStatuses,
} from "../../../../../app/db/actions";

// Schema for validating incoming status data
const createStatusSchema = z.object({
  projectId: z.number(),
  name: z.string().min(1, "Status name is required"),
  color: z.string().min(1, "Color is required"),
});

const querySchema = z.object({
  projectId: z.string().transform(Number),
});

const reorderStatusesSchema = z.object({
  projectId: z.number(),
  orderedStatusIds: z.array(z.number()),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json(
        { message: "Missing projectId parameter" },
        { status: 400 }
      );
    }

    const validatedQuery = querySchema.parse({ projectId });
    const statuses = await getStatusesForProject(validatedQuery.projectId);

    return NextResponse.json(
      { message: "Statuses retrieved successfully!", statuses },
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

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const body = await req.json();
    const statusData = createStatusSchema.parse(body);

    const newStatus = await addNoteStatus(statusData);

    return NextResponse.json(
      { message: "Status created successfully!", status: newStatus },
      { status: 201 }
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

export async function PUT(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const body = await req.json();

    // Check if this is a reorder request
    if ("orderedStatusIds" in body) {
      const reorderData = reorderStatusesSchema.parse(body);
      await reorderStatuses(reorderData);

      return NextResponse.json(
        { message: "Statuses reordered successfully!" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Invalid request format" },
      { status: 400 }
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
