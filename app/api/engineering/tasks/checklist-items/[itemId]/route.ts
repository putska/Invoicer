// This file handles PATCH and DELETE for a single checklist item by ID

import { NextRequest, NextResponse } from "next/server";
import {
  updateChecklistItem,
  deleteChecklistItem,
} from "../../../../../db/actions";

// PATCH /api/engineering/tasks/checklist-items/[itemId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const { itemId } = params;
  const data = await req.json();
  const item = await updateChecklistItem(Number(itemId), data);
  return NextResponse.json({ item });
}

// DELETE /api/engineering/tasks/checklist-items/[itemId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const { itemId } = params;
  await deleteChecklistItem(Number(itemId));
  return NextResponse.json({ success: true });
}
