// app/api/activities/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getActivitiesByCategoryId, createActivity } from "../../db/actions";
import { Activity } from "../../../../types";
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly
import { z } from "zod";

// Define the Zod schema for activity creation
const activitySchema = z.object({
  categoryId: z.number().min(1, "Category ID must be a positive number"),
  name: z.string().min(1, "Name is required"),
  // Remove sortOrder from frontend; backend handles it
  costCode: z.string().min(1, "Cost code is required"),
  estimatedHours: z.number().min(0).optional(),
  equipmentId: z.number().nullable().optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Validate and parse query parameters
  const categoryIdParam = req.nextUrl.searchParams.get("categoryId");
  const categoryId = parseInt(categoryIdParam || "", 10);

  if (isNaN(categoryId)) {
    return NextResponse.json(
      { message: "Invalid or missing categoryId parameter" },
      { status: 400 }
    );
  }

  try {
    const activities = await getActivitiesByCategoryId(categoryId);
    return NextResponse.json({ activities }, { status: 200 });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { message: "Error fetching activities" },
      { status: 500 }
    );
  }
}

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
    const parsedData = activitySchema.parse(body); // Validate incoming data

    const newActivity = await createActivity(parsedData);
    return NextResponse.json({ newActivity }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Validation failed:", error.errors);
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { message: "Error creating activity" },
      { status: 500 }
    );
  }
}
