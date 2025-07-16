// app/api/special-conditions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getSpecialConditionsByElevationId,
  createSpecialCondition,
  deleteSpecialCondition,
} from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";

// Zod schema for special condition creation
const createSpecialConditionSchema = z.object({
  elevationId: z.number().min(1, "Elevation ID must be a positive number"),
  conditionType: z.enum([
    "corner",
    "return",
    "angle",
    "step_down",
    "canopy",
    "soffit",
    "column_cover",
  ]),
  position: z.number().min(0, "Position must be non-negative"),
  width: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  angle: z.number().min(-360).max(360).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

// GET Route: Fetch special conditions for an elevation
export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Validate and parse query parameters
  const { searchParams } = new URL(req.url);
  const elevationIdParam = searchParams.get("elevationId");

  if (!elevationIdParam) {
    return NextResponse.json(
      { message: "elevationId parameter is required" },
      { status: 400 }
    );
  }

  const elevationId = parseInt(elevationIdParam, 10);
  if (isNaN(elevationId)) {
    return NextResponse.json(
      { message: "Invalid elevationId parameter" },
      { status: 400 }
    );
  }

  try {
    const conditionsList = await getSpecialConditionsByElevationId(elevationId);
    return NextResponse.json(
      { specialConditions: conditionsList },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching special conditions:", error);
    return NextResponse.json(
      { message: "Error fetching special conditions" },
      { status: 500 }
    );
  }
}

// POST Route: Create a new special condition
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
    const parsedData = createSpecialConditionSchema.parse(body);

    const newCondition = await createSpecialCondition(parsedData);

    return NextResponse.json(
      {
        message: "Special condition created successfully!",
        specialCondition: newCondition,
      },
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
    console.error("Error creating special condition:", error);
    return NextResponse.json(
      { message: "Error creating special condition" },
      { status: 500 }
    );
  }
}

// DELETE Route: Delete a special condition
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
    const conditionIdParam = searchParams.get("conditionId");

    if (!conditionIdParam) {
      return NextResponse.json(
        { message: "conditionId parameter is required" },
        { status: 400 }
      );
    }

    const conditionId = parseInt(conditionIdParam, 10);

    if (isNaN(conditionId)) {
      return NextResponse.json(
        { message: "Invalid conditionId parameter" },
        { status: 400 }
      );
    }

    await deleteSpecialCondition(conditionId);

    return NextResponse.json(
      { message: "Special condition deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting special condition:", error);
    return NextResponse.json(
      { message: "Error deleting special condition" },
      { status: 500 }
    );
  }
}
