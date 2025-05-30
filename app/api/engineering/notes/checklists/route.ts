//app/api/engineering/notes/checklists/route.ts
// API routes for managing note checklists

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../admin/helpers";
import { getChecklistsForNote, addNoteChecklist } from "../../../../db/actions";

// Schema for validating incoming checklist data
const createChecklistSchema = z.object({
  noteId: z.number(),
  name: z.string().min(1, "Checklist name is required"),
});

const querySchema = z.object({
  noteId: z.string().transform(Number),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("noteId");

    if (!noteId) {
      return NextResponse.json(
        { message: "Missing noteId parameter" },
        { status: 400 }
      );
    }

    const validatedQuery = querySchema.parse({ noteId });
    const checklists = await getChecklistsForNote(validatedQuery.noteId);

    return NextResponse.json(
      { message: "Checklists retrieved successfully!", checklists },
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
    const checklistData = createChecklistSchema.parse(body);

    const newChecklist = await addNoteChecklist(checklistData);

    return NextResponse.json(
      { message: "Checklist created successfully!", checklist: newChecklist },
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
