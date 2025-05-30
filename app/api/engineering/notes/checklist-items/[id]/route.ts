//app/api/engineering/notes/checklist-items/[id]/route.ts
// API routes for managing individual note checklist items

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../../admin/helpers";
import {
  updateNoteChecklistItem,
  deleteNoteChecklistItem,
} from "../../../../../db/actions";

// Schema for validating updates
const updateChecklistItemSchema = z.object({
  text: z.string().min(1, "Item text is required").optional(),
  checked: z.boolean().optional(),
  sortOrder: z.number().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const itemId = parseInt(params.id);
    if (isNaN(itemId)) {
      return NextResponse.json({ message: "Invalid item ID" }, { status: 400 });
    }

    const body = await req.json();
    const updateData = updateChecklistItemSchema.parse(body);

    const updatedItem = await updateNoteChecklistItem(itemId, updateData);

    return NextResponse.json(
      { message: "Checklist item updated successfully!", item: updatedItem },
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

    const itemId = parseInt(params.id);
    if (isNaN(itemId)) {
      return NextResponse.json({ message: "Invalid item ID" }, { status: 400 });
    }

    await deleteNoteChecklistItem(itemId);

    return NextResponse.json(
      { message: "Checklist item deleted successfully!" },
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
