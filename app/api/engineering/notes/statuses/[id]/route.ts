//app/api/engineering/notes/statuses/[id]/route.ts
// API routes for managing individual note statuses

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../../../../app/api/admin/helpers";
import {
  updateNoteStatus,
  deleteNoteStatus,
} from "../../../../../../app/db/actions";

// Schema for validating updates
const updateStatusSchema = z.object({
  name: z.string().min(1, "Status name is required").optional(),
  color: z.string().min(1, "Color is required").optional(),
  isDefault: z.boolean().optional(),
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

    const statusId = parseInt(params.id);
    if (isNaN(statusId)) {
      return NextResponse.json(
        { message: "Invalid status ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updateData = updateStatusSchema.parse(body);

    const updatedStatus = await updateNoteStatus(statusId, updateData);

    return NextResponse.json(
      { message: "Status updated successfully!", status: updatedStatus },
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

    const statusId = parseInt(params.id);
    if (isNaN(statusId)) {
      return NextResponse.json(
        { message: "Invalid status ID" },
        { status: 400 }
      );
    }

    await deleteNoteStatus(statusId);

    return NextResponse.json(
      { message: "Status deleted successfully!" },
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
