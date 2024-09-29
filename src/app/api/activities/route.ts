// app/api/admin/getUsers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getActivitiesByCategoryId,
  createActivity,
  updateActivity,
  deleteActivity,
} from "../../../app/db/actions";
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly

// Define the Zod schema for activity creation and updates
const activitySchema = z.object({
  categoryId: z.number().min(1, "Category ID must be a positive number"),
  name: z.string().min(1, "Name is required"),
  sortOrder: z.number().optional(),
  estimatedHours: z.number().optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
});

// GET Route: Fetch activities by categoryId
export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

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

// POST Route: Create a new activity
export async function POST(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user
  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  try {
    const body = await req.json();
    const parsedData = activitySchema.parse(body); // Validate incoming data

    const newActivity = await createActivity(parsedData);
    return NextResponse.json({ newActivity }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Validation failed:", error.errors); // Log validation errors
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating activity:", error); // Log other errors
    return NextResponse.json(
      { message: "Error creating activity" },
      { status: 500 }
    );
  }
}

// PUT Route: Update an existing activity
export async function PUT(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user
  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  // Validate and parse query parameters
  const activityIdParam = req.nextUrl.searchParams.get("activityId");
  const activityId = parseInt(activityIdParam || "", 10);

  if (isNaN(activityId)) {
    return NextResponse.json(
      { message: "Invalid or missing activityId parameter" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsedData = activitySchema.partial().parse(body); // Validate incoming data (partial for updates)

    const updatedActivity = await updateActivity(activityId, parsedData);
    if (!updatedActivity) {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ updatedActivity }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Validation failed:", error.errors); // Log validation errors
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating activity:", error); // Log other errors
    return NextResponse.json(
      { message: "Error updating activity" },
      { status: 500 }
    );
  }
}

// DELETE Route: Delete an activity by ID
export async function DELETE(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user
  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  // Validate and parse query parameters
  const activityIdParam = req.nextUrl.searchParams.get("activityId");
  const activityId = parseInt(activityIdParam || "", 10);

  if (isNaN(activityId)) {
    return NextResponse.json(
      { message: "Invalid or missing activityId parameter" },
      { status: 400 }
    );
  }

  try {
    const success = await deleteActivity(activityId);
    if (!success) {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Activity deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting activity:", error); // Log other errors
    return NextResponse.json(
      { message: "Error deleting activity" },
      { status: 500 }
    );
  }
}
