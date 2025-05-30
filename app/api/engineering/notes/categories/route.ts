//app/api/engineering/notes/categories/route.ts
// API routes for managing note categories

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "../../../../../app/api/admin/helpers";
import {
  addNoteCategory,
  updateNoteCategory,
  deleteNoteCategory,
  reorderCategories,
} from "../../../../../app/db/actions";

// Schema for validating incoming category data
const createCategorySchema = z.object({
  projectId: z.number(),
  name: z.string().min(1, "Category name is required"),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").optional(),
  sortOrder: z.number().optional(),
});

const reorderCategoriesSchema = z.object({
  projectId: z.number(),
  orderedCategoryIds: z.array(z.number()),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return;

    const body = await req.json();
    const categoryData = createCategorySchema.parse(body);

    const newCategory = await addNoteCategory(categoryData);

    return NextResponse.json(
      { message: "Category created successfully!", category: newCategory },
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
    if ("orderedCategoryIds" in body) {
      const reorderData = reorderCategoriesSchema.parse(body);
      await reorderCategories(reorderData);

      return NextResponse.json(
        { message: "Categories reordered successfully!" },
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
