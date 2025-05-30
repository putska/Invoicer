//app/api/engineering/notes/notes/[id]/route.ts
// API routes for managing individual engineering notes by ID

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../../../../app/api/admin/helpers";
import {
  updateEngineeringNote,
  deleteEngineeringNote,
  getEngineeringNoteWithChecklists,
} from "../../../../../../app/db/actions";

// Schema for validating updates
const updateNoteSchema = z.object({
  title: z.string().min(1, "Note title is required").optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "in_progress", "completed", "blocked"]).optional(),
  categoryId: z.number().optional(), // For moving between categories
  sortOrder: z.number().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const noteId = parseInt(params.id);
    if (isNaN(noteId)) {
      return NextResponse.json({ message: "Invalid note ID" }, { status: 400 });
    }

    const note = await getEngineeringNoteWithChecklists(noteId);

    if (!note) {
      return NextResponse.json({ message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Note retrieved successfully!", note },
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const noteId = parseInt(params.id);
    if (isNaN(noteId)) {
      return NextResponse.json({ message: "Invalid note ID" }, { status: 400 });
    }

    const body = await req.json();
    const updateData = updateNoteSchema.parse(body);

    const updatedNote = await updateEngineeringNote(noteId, updateData);

    return NextResponse.json(
      { message: "Note updated successfully!", note: updatedNote },
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const noteId = parseInt(params.id);
    if (isNaN(noteId)) {
      return NextResponse.json({ message: "Invalid note ID" }, { status: 400 });
    }

    await deleteEngineeringNote(noteId);

    return NextResponse.json(
      { message: "Note deleted successfully!" },
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
