import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getActivitiesByCategoryId,
  createActivity,
  updateActivity,
  deleteActivity,
} from "@/app/db/actions";

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
  const categoryId = parseInt(req.nextUrl.searchParams.get("categoryId") || "");
  if (!categoryId) {
    return NextResponse.json(
      { message: "Missing categoryId parameter" },
      { status: 400 }
    );
  }

  try {
    const activities = await getActivitiesByCategoryId(categoryId);
    return NextResponse.json({ activities }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error fetching activities", error: errorMessage },
      { status: 500 }
    );
  }
}

// POST Route: Create a new activity
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsedData = activitySchema.parse(body); // Validate incoming data

    const newActivity = await createActivity(parsedData);
    return NextResponse.json({ newActivity }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error creating activity", error: errorMessage },
      { status: 500 }
    );
  }
}

// PUT Route: Update an existing activity
export async function PUT(req: NextRequest) {
  const activityId = parseInt(req.nextUrl.searchParams.get("activityId") || "");
  if (!activityId) {
    return NextResponse.json(
      { message: "Missing activityId parameter" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsedData = activitySchema.partial().parse(body); // Validate incoming data (partial for updates)

    const updatedActivity = await updateActivity(activityId, parsedData);
    return NextResponse.json({ updatedActivity }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error updating activity", error: errorMessage },
      { status: 500 }
    );
  }
}

// DELETE Route: Delete an activity by ID
export async function DELETE(req: NextRequest) {
  const activityId = parseInt(req.nextUrl.searchParams.get("activityId") || "");
  if (!activityId) {
    return NextResponse.json(
      { message: "Missing activityId parameter" },
      { status: 400 }
    );
  }

  try {
    await deleteActivity(activityId);
    return NextResponse.json(
      { message: "Activity deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Error deleting activity", error: errorMessage },
      { status: 500 }
    );
  }
}
