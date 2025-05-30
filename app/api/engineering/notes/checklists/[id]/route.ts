//app/api/engineering/notes/checklists/[id]/route.ts
// API routes for managing individual note checklists

import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../admin/helpers";
import { deleteNoteChecklist } from "../../../../../db/actions";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const checklistId = parseInt(params.id);
    if (isNaN(checklistId)) {
      return NextResponse.json(
        { message: "Invalid checklist ID" },
        { status: 400 }
      );
    }

    await deleteNoteChecklist(checklistId);

    return NextResponse.json(
      { message: "Checklist deleted successfully!" },
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
