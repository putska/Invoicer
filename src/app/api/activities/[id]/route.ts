// app/api/activities/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  getActivityById,
  updateActivity,
  deleteActivity,
} from "../../../db/actions";
import { Activity } from "../../../../../types";
import { authenticate, authorize } from "../../../../app/api/admin/helpers"; // Adjust the import path accordingly
import { z } from "zod";

// Define the Zod schema for activity updates
const activityUpdateSchema = z.object({
  categoryId: z.number().min(1).optional(),
  name: z.string().min(1).optional(),
  estimatedHours: z.number().min(0).optional(),
  equipmentId: z.number().nullable().optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const activityId = parseInt(params.id, 10);

  if (isNaN(activityId)) {
    return NextResponse.json(
      { message: "Invalid activity ID" },
      { status: 400 }
    );
  }

  try {
    const activity = await getActivityById(activityId);
    if (activity) {
      return NextResponse.json(
        { message: "Activity retrieved successfully", activity },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json(
      { message: "Error fetching activity" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate and authorize the user
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized; // Response already sent in authorize()
  }

  const activityId = parseInt(params.id, 10);

  if (isNaN(activityId)) {
    return NextResponse.json(
      { message: "Invalid activity ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsedData = activityUpdateSchema.parse(body); // Validate incoming data

    const updatedActivity = await updateActivity(activityId, parsedData);

    if (!updatedActivity) {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Activity updated successfully", activity: updatedActivity },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Validation failed:", error.errors);
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating activity:", error);
    return NextResponse.json(
      { message: "Error updating activity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate and authorize the user
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized; // Response already sent in authorize()
  }

  const activityId = parseInt(params.id, 10);

  if (isNaN(activityId)) {
    return NextResponse.json(
      { message: "Invalid activity ID" },
      { status: 400 }
    );
  }

  try {
    const success = await deleteActivity(activityId);
    if (success) {
      return NextResponse.json(
        { message: "Activity deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Activity not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error deleting activity:", error);
    return NextResponse.json(
      { message: "Error deleting activity" },
      { status: 500 }
    );
  }
}
