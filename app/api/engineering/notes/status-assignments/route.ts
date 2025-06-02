//app/api/engineering/notes/status-assignments/route.ts
// API routes for managing note status assignments

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../../../app/api/admin/helpers";
import {
  assignStatusToNote,
  removeStatusFromNote,
} from "../../../../../app/db/actions";

// Schema for validating incoming assignment data
const assignStatusSchema = z.object({
  noteId: z.number(),
  statusId: z.number(),
});

const removeStatusSchema = z.object({
  noteId: z.number(),
  statusId: z.number(),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const body = await req.json();
    const assignmentData = assignStatusSchema.parse(body);

    await assignStatusToNote(assignmentData);

    return NextResponse.json(
      { message: "Status assigned successfully!" },
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

export async function DELETE(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const body = await req.json();
    const removalData = removeStatusSchema.parse(body);

    await removeStatusFromNote(removalData);

    return NextResponse.json(
      { message: "Status removed successfully!" },
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
