// app/api/categories/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCategoriesByProjectId, createCategory } from "../../db/actions";
import { Category } from "../../types";
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly

// Define the Zod schema for category creation
const categorySchema = z.object({
  projectId: z.number().min(1, "Project ID must be a positive number"),
  name: z.string().min(1, "Name is required"),
  // Do not include sortOrder in the schema since it's handled on the backend
});

// GET Route: Fetch all categories for a specific project
export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Validate and parse query parameters
  const { searchParams } = new URL(req.url);
  const projectIdParam = searchParams.get("projectId");
  const projectId = parseInt(projectIdParam || "", 10);

  if (isNaN(projectId)) {
    return NextResponse.json(
      { message: "Invalid or missing projectId parameter" },
      { status: 400 }
    );
  }

  try {
    const categoriesList = await getCategoriesByProjectId(projectId);
    return NextResponse.json({ categories: categoriesList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { message: "Error fetching categories" },
      { status: 500 }
    );
  }
}

// POST Route: Create a new category
export async function POST(req: NextRequest) {
  // Authenticate and authorize the user
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized; // Response already sent in authorize()
  }

  try {
    const body = await req.json();
    const parsedData = categorySchema.parse(body); // Validate incoming data

    const newCategory = await createCategory(parsedData);
    return NextResponse.json(
      { message: "Category added successfully!", newCategory },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Validation failed:", error.errors);
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error adding category:", error);
    return NextResponse.json(
      { message: "Error adding category" },
      { status: 500 }
    );
  }
}
