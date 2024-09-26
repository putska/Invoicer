import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/db/actions";
import { authenticate, authorize } from "@/app/api/admin/helpers"; // Adjust the import path accordingly
import {
  PERMISSION_LEVELS,
  PermissionLevel,
} from "@/app/constants/permissions";

// Define the Zod schema for category creation and updates
const categorySchema = z.object({
  projectId: z.number().min(1, "Project ID must be a positive number"),
  name: z.string().min(1, "Name is required"),
  sortOrder: z.number().optional(),
});

// POST Route: Create a new category
export async function POST(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  try {
    const body = await req.json();
    const parsedData = categorySchema.parse(body); // Validate incoming data

    const newCategory = await createCategory(parsedData);
    return NextResponse.json({ newCategory }, { status: 201 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error creating category", error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT Route: Update an existing category
export async function PUT(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  const categoryId = parseInt(req.nextUrl.searchParams.get("categoryId") || "");
  if (!categoryId) {
    return NextResponse.json(
      { message: "Missing categoryId parameter" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsedData = categorySchema.partial().parse(body); // Validate incoming data (partial for updates)

    const updatedCategory = await updateCategory(categoryId, parsedData);
    return NextResponse.json({ updatedCategory }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { message: "Error updating category", error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE Route: Delete a category by ID
export async function DELETE(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  const categoryId = parseInt(req.nextUrl.searchParams.get("categoryId") || "");
  if (!categoryId) {
    return NextResponse.json(
      { message: "Missing categoryId parameter" },
      { status: 400 }
    );
  }

  try {
    await deleteCategory(categoryId);
    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error deleting category", error: errorMessage },
      { status: 500 }
    );
  }
}
