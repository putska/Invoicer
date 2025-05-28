// This file handles GET for all checklists for a task, and POST to create a checklist

import { NextRequest, NextResponse } from "next/server";
import {
  getChecklistsByTaskId,
  createChecklist,
} from "../../../../db/actions";

// GET /api/engineering/tasks/checklists?taskId=123
export async function GET(req: NextRequest) {
  const taskId = Number(req.nextUrl.searchParams.get("taskId"));
  if (!taskId) return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
  const checklists = await getChecklistsByTaskId(taskId);
  return NextResponse.json({ checklists });
}

// POST /api/engineering/tasks/checklists
// { taskId, name }
export async function POST(req: NextRequest) {
  const { taskId, name } = await req.json();
  if (!taskId || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const checklist = await createChecklist(taskId, name);
  return NextResponse.json({ checklist });
}
