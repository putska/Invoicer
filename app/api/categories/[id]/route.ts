// app/api/categories/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../../../db/actions"; // Adjust the import path accordingly
import { authenticate, authorize } from "../../../../app/api/admin/helpers"; // Adjust the import path accordingly
import { Category } from "../../../types";

// Define the Zod schema for category updates
const categoryUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  // Include other fields that can be updated, excluding sortOrder
});

/**
 * GET Route: Fetch a specific category by ID
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const categoryId = parseInt(params.id, 10);

  if (isNaN(categoryId)) {
    return NextResponse.json(
      { message: "Invalid category ID" },
      { status: 400 }
    );
  }

  try {
    const category = await getCategoryById(categoryId);
    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ category }, { status: 200 });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { message: "Error fetching category" },
      { status: 500 }
    );
  }
}

/**
 * PUT Route: Update a specific category by ID
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized; // Response already sent in authorize()
  }

  const categoryId = parseInt(params.id, 10);

  if (isNaN(categoryId)) {
    return NextResponse.json(
      { message: "Invalid category ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsedData = categoryUpdateSchema.parse(body); // Validate incoming data

    if (Object.keys(parsedData).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided for update" },
        { status: 400 }
      );
    }

    const updatedCategory = await updateCategory(categoryId, parsedData);

    if (!updatedCategory) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Category updated successfully!", category: updatedCategory },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Validation failed:", error.errors); // Log validation errors
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating category:", error); // Log other errors
    return NextResponse.json(
      { message: "Error updating category", error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * DELETE Route: Delete a specific category by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized; // Response already sent in authorize()
  }

  const categoryId = parseInt(params.id, 10);

  if (isNaN(categoryId)) {
    return NextResponse.json(
      { message: "Invalid category ID" },
      { status: 400 }
    );
  }

  try {
    const success = await deleteCategory(categoryId);
    if (!success) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Category deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { message: "Error deleting category", error: (error as Error).message },
      { status: 500 }
    );
  }
}
