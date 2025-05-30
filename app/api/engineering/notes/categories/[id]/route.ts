//app/api/engineering/notes/categories/[id]/route.ts
// API routes for managing individual note categories

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../../../../app/api/admin/helpers";
import {
  updateNoteCategory,
  deleteNoteCategory,
} from "../../../../../../app/db/actions";

// Schema for validating updates
const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
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

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updateData = updateCategorySchema.parse(body);

    const updatedCategory = await updateNoteCategory(categoryId, updateData);

    return NextResponse.json(
      { message: "Category updated successfully!", category: updatedCategory },
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

    const categoryId = parseInt(params.id);
    if (isNaN(categoryId)) {
      return NextResponse.json(
        { message: "Invalid category ID" },
        { status: 400 }
      );
    }

    await deleteNoteCategory(categoryId);

    return NextResponse.json(
      { message: "Category deleted successfully!" },
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
