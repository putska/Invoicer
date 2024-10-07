// app/api/categories/updateSortOrder/route.ts

import { NextRequest, NextResponse } from "next/server";
import { updateCategoriesSortOrder } from "../../../db/actions";
import { Category } from "../../../../../types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const categoriesToUpdate: Category[] = body.categories;

    if (!Array.isArray(categoriesToUpdate)) {
      return NextResponse.json(
        { message: "Invalid data: categories must be an array" },
        { status: 400 }
      );
    }

    await updateCategoriesSortOrder(categoriesToUpdate);

    return NextResponse.json(
      { message: "Categories sort order updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating categories sort order:", error);
    return NextResponse.json(
      { message: "Error updating categories sort order", error },
      { status: 500 }
    );
  }
}
