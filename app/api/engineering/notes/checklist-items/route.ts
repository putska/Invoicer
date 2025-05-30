//app/api/engineering/notes/checklist-items/route.ts
// API routes for managing note checklist items

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../admin/helpers";
import {
  addNoteChecklistItem,
  reorderNotesChecklistItems,
} from "../../../../db/actions";

// Schema for validating incoming checklist item data
const createChecklistItemSchema = z.object({
  checklistId: z.number(),
  text: z.string().min(1, "Item text is required"),
});

const reorderChecklistItemsSchema = z.object({
  checklistId: z.number(),
  orderedItemIds: z.array(z.number()),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const body = await req.json();
    const itemData = createChecklistItemSchema.parse(body);

    const newItem = await addNoteChecklistItem(itemData);

    return NextResponse.json(
      { message: "Checklist item created successfully!", item: newItem },
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
    if ("orderedItemIds" in body) {
      const reorderData = reorderChecklistItemsSchema.parse(body);
      await reorderNotesChecklistItems(reorderData);

      return NextResponse.json(
        { message: "Checklist items reordered successfully!" },
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
