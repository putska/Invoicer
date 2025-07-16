// app/api/mullions/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getMullionsByOpeningId,
  createMullion,
  deleteMullion,
  generateGlassPanels,
} from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";

// Zod schema for mullion creation
const createMullionSchema = z.object({
  openingId: z.number().min(1, "Opening ID must be a positive number"),
  type: z.enum(["vertical", "horizontal"]),
  position: z.number().min(0, "Position must be non-negative"),
  mullionType: z.enum(["intermediate", "structural", "expansion"]),
  depth: z.number().min(0.1).optional(),
  notes: z.string().optional(),
});

// GET Route: Fetch mullions for an opening
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
    const mullionsList = await getMullionsByOpeningId(openingId);
    return NextResponse.json({ mullions: mullionsList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching mullions:", error);
    return NextResponse.json(
      { message: "Error fetching mullions" },
      { status: 500 }
    );
  }
}

// POST Route: Create a new mullion
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
    const parsedData = createMullionSchema.parse(body);

    const newMullion = await createMullion(parsedData);

    // Regenerate glass panels after adding mullion
    await generateGlassPanels(parsedData.openingId);

    return NextResponse.json(
      { message: "Mullion created successfully!", mullion: newMullion },
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
    console.error("Error creating mullion:", error);
    return NextResponse.json(
      { message: "Error creating mullion" },
      { status: 500 }
    );
  }
}

// DELETE Route: Delete a mullion
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
    const mullionIdParam = searchParams.get("mullionId");
    const openingIdParam = searchParams.get("openingId");

    if (!mullionIdParam || !openingIdParam) {
      return NextResponse.json(
        { message: "Both mullionId and openingId parameters are required" },
        { status: 400 }
      );
    }

    const mullionId = parseInt(mullionIdParam, 10);
    const openingId = parseInt(openingIdParam, 10);

    if (isNaN(mullionId) || isNaN(openingId)) {
      return NextResponse.json(
        { message: "Invalid mullionId or openingId parameter" },
        { status: 400 }
      );
    }

    await deleteMullion(mullionId);

    // Regenerate glass panels after removing mullion
    await generateGlassPanels(openingId);

    return NextResponse.json(
      { message: "Mullion deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting mullion:", error);
    return NextResponse.json(
      { message: "Error deleting mullion" },
      { status: 500 }
    );
  }
}
