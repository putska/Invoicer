//app/api/engineering/notes/checklists/summary/[noteId]/route.ts
// API route for getting checklist summary for a note

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../../admin/helpers";
import { getChecklistSummaryForNote } from "../../../../../../db/actions";

export async function GET(
  req: NextRequest,
  { params }: { params: { noteId: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const noteId = parseInt(params.noteId);
    if (isNaN(noteId)) {
      return NextResponse.json({ message: "Invalid note ID" }, { status: 400 });
    }

    const summary = await getChecklistSummaryForNote(noteId);

    return NextResponse.json(
      { message: "Checklist summary retrieved successfully!", summary },
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
