// app/api/doors/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDoorsByOpeningId, createDoor, deleteDoor } from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";

// Zod schema for door creation
const createDoorSchema = z.object({
  openingId: z.number().min(1, "Opening ID must be a positive number"),
  name: z.string().min(1, "Name is required"),
  doorMark: z.string().optional(),
  position: z.number().min(0, "Position must be non-negative"),
  width: z.number().min(0.1, "Width must be greater than 0"),
  height: z.number().min(0.1, "Height must be greater than 0"),
  doorType: z.enum(["single", "double", "slider", "revolving", "automatic"]),
  handingType: z.enum(["left", "right", "center"]).optional(),
  hasVision: z.boolean().optional(),
  doorMaterial: z.string().optional(),
  lockType: z.string().optional(),
  closerType: z.string().optional(),
  hasAutomaticOperator: z.boolean().optional(),
  notes: z.string().optional(),
});

// GET Route: Fetch doors for an opening
export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Validate and parse query parameters
  const { searchParams } = new URL(req.url);
  const openingIdParam = searchParams.get("openingId");

  if (!openingIdParam) {
    return NextResponse.json(
      { message: "openingId parameter is required" },
      { status: 400 }
    );
  }

  const openingId = parseInt(openingIdParam, 10);
  if (isNaN(openingId)) {
    return NextResponse.json(
      { message: "Invalid openingId parameter" },
      { status: 400 }
    );
  }

  try {
    const doorsList = await getDoorsByOpeningId(openingId);
    return NextResponse.json({ doors: doorsList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching doors:", error);
    return NextResponse.json(
      { message: "Error fetching doors" },
      { status: 500 }
    );
  }
}

// POST Route: Create a new door
export async function POST(req: NextRequest) {
  // Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  try {
    const body = await req.json();
    const parsedData = createDoorSchema.parse(body);

    const newDoor = await createDoor(parsedData);

    return NextResponse.json(
      { message: "Door created successfully!", door: newDoor },
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
    console.error("Error creating door:", error);
    return NextResponse.json(
      { message: "Error creating door" },
      { status: 500 }
    );
  }
}

// DELETE Route: Delete a door
export async function DELETE(req: NextRequest) {
  // Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  try {
    const { searchParams } = new URL(req.url);
    const doorIdParam = searchParams.get("doorId");

    if (!doorIdParam) {
      return NextResponse.json(
        { message: "doorId parameter is required" },
        { status: 400 }
      );
    }

    const doorId = parseInt(doorIdParam, 10);

    if (isNaN(doorId)) {
      return NextResponse.json(
        { message: "Invalid doorId parameter" },
        { status: 400 }
      );
    }

    await deleteDoor(doorId);

    return NextResponse.json(
      { message: "Door deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting door:", error);
    return NextResponse.json(
      { message: "Error deleting door" },
      { status: 500 }
    );
  }
}
