// This file handles POST to create a checklist item and PUT to reorder items
// /app/api/engineering/tasks/checklist-items/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  addChecklistItem,
  reorderChecklistItems,
} from "../../../../db/actions";

// POST /api/engineering/tasks/checklist-items
// { checklistId, text }
export async function POST(req: NextRequest) {
  const { checklistId, text } = await req.json();
  if (!checklistId || !text)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const item = await addChecklistItem(checklistId, text);
  return NextResponse.json({ item });
}

// PUT /api/engineering/tasks/checklist-items
// { checklistId, orderedItemIds }
export async function PUT(req: NextRequest) {
  const { checklistId, orderedItemIds } = await req.json();
  if (!checklistId || !Array.isArray(orderedItemIds))
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  // Pass as a single object that matches ReorderChecklistItemsForm
  await reorderChecklistItems({ checklistId, orderedItemIds });

  return NextResponse.json({ success: true });
}
