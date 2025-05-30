//app/api/engineering/notes/notes/route.ts
// API routes for managing individual engineering notes

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../../../app/api/admin/helpers";
import {
  addEngineeringNote,
  reorderNotes,
} from "../../../../../app/db/actions";

// Schema for validating incoming note data
const createNoteSchema = z.object({
  categoryId: z.number(),
  title: z.string().min(1, "Note title is required"),
  content: z.string().optional(),
  status: z.enum(["draft", "in_progress", "completed", "blocked"]).optional(),
});

const reorderNotesSchema = z.object({
  categoryId: z.number(),
  orderedNoteIds: z.array(z.number()),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const body = await req.json();
    const noteData = createNoteSchema.parse(body);

    const newNote = await addEngineeringNote(noteData);

    return NextResponse.json(
      { message: "Note created successfully!", note: newNote },
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
    if ("orderedNoteIds" in body) {
      const reorderData = reorderNotesSchema.parse(body);
      await reorderNotes(reorderData);

      return NextResponse.json(
        { message: "Notes reordered successfully!" },
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
