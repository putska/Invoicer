// This file handles GET, PATCH, DELETE for a single checklist by ID

import { NextRequest, NextResponse } from "next/server";
import {
  updateChecklist,
  deleteChecklist,
  getChecklistsByTaskId,
} from "../../../../../db/actions";

// GET /api/engineering/tasks/checklists/[checklistId]?taskId=123
export async function GET(
  req: NextRequest,
  { params }: { params: { checklistId: string } }
) {
  const { checklistId } = params;
  const taskId = Number(req.nextUrl.searchParams.get("taskId"));
  if (!taskId)
    return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  const checklists = await getChecklistsByTaskId(taskId);
  const checklist = checklists.find((cl: any) => cl.id === Number(checklistId));
  if (!checklist)
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
  return NextResponse.json({ checklist });
}

// PATCH /api/engineering/tasks/checklists/[checklistId]
export async function PATCH(
  req: NextRequest,
  { params }: { params: { checklistId: string } }
) {
  const { checklistId } = params;
  const data = await req.json();
  const checklist = await updateChecklist(Number(checklistId), data);
  return NextResponse.json({ checklist });
}

// DELETE /api/engineering/tasks/checklists/[checklistId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { checklistId: string } }
) {
  const { checklistId } = params;
  await deleteChecklist(Number(checklistId));
  return NextResponse.json({ success: true });
}
