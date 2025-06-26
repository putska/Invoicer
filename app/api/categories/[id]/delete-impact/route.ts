// New route for getting delete impact
// app/api/categories/[id]/delete-impact/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  getCategoryById,
  getCategoryDeleteImpact,
} from "../../../../db/actions";
import { authenticate } from "../../../../../app/api/admin/helpers";

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
    const impact = await getCategoryDeleteImpact(categoryId);
    const category = await getCategoryById(categoryId);

    if (!category) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        type: "category",
        id: categoryId,
        name: category.name,
        impact,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error getting category delete impact:", error);
    return NextResponse.json(
      { message: "Error getting delete impact" },
      { status: 500 }
    );
  }
}
