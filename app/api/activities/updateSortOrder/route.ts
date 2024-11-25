// app/api/activities/updateSortOrder/route.ts

import { NextRequest, NextResponse } from "next/server";
import { updateSortOrdersInDB } from "../../../../app/db/actions";
import {
  UpdateSortOrderRequest,
  UpdateSortOrderResponse,
} from "../../../types";

/**
 * Combined endpoint to update sort orders for categories and activities.
 * Expects a JSON body with 'categories' and 'activities' arrays.
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the JSON body
    const body: UpdateSortOrderRequest = await req.json();

    const { categories: updatedCategories, activities: updatedActivities } =
      body;

    // Basic Validation
    if (
      !Array.isArray(updatedCategories) ||
      !updatedCategories.every(
        (cat) =>
          typeof cat.categoryId === "number" &&
          typeof cat.sortOrder === "number"
      )
    ) {
      return NextResponse.json(
        { error: "Invalid data format for categories." },
        { status: 400 }
      );
    }

    if (
      !Array.isArray(updatedActivities) ||
      !updatedActivities.every(
        (act) =>
          typeof act.activityId === "number" &&
          typeof act.sortOrder === "number" &&
          (typeof act.categoryId === "number" || act.categoryId === undefined)
      )
    ) {
      return NextResponse.json(
        { error: "Invalid data format for activities." },
        { status: 400 }
      );
    }

    // Perform the combined updates using the new action function
    await updateSortOrdersInDB(updatedCategories, updatedActivities);

    // Respond with success
    const response: UpdateSortOrderResponse = {
      message: "Sort orders updated successfully.",
    };
    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    // Type as 'any' to access error.message
    console.error("Failed to update sort orders:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update sort orders." },
      { status: 500 }
    );
  }
}
