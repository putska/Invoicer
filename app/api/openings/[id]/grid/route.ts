// app/api/openings/[id]/grid/route.ts - Main grid operations

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getOpeningWithGrid,
  generateGridForOpening,
  updateGridAndRegenerate,
  getGridStatistics,
} from "../../../../db/actions";
import { authenticate, authorize } from "../../../admin/helpers";

// GET /api/openings/[id]/grid - Get opening with complete grid data
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const openingId = parseInt(params.id, 10);
  if (isNaN(openingId)) {
    return NextResponse.json(
      { message: "Invalid opening ID" },
      { status: 400 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const includeStats = searchParams.get("includeStats") === "true";

    const openingWithGrid = await getOpeningWithGrid(openingId);

    if (!openingWithGrid) {
      return NextResponse.json(
        { message: "Opening not found" },
        { status: 404 }
      );
    }

    let stats = null;
    if (includeStats) {
      stats = await getGridStatistics(openingId);
    }

    return NextResponse.json(
      {
        opening: openingWithGrid,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching opening grid:", error);
    return NextResponse.json(
      { message: "Error fetching opening grid" },
      { status: 500 }
    );
  }
}

// POST /api/openings/[id]/grid - Regenerate grid
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  const openingId = parseInt(params.id, 10);
  if (isNaN(openingId)) {
    return NextResponse.json(
      { message: "Invalid opening ID" },
      { status: 400 }
    );
  }

  try {
    const { mullions, glassPanels } = await generateGridForOpening(openingId);
    const stats = await getGridStatistics(openingId);

    return NextResponse.json(
      {
        message: "Grid regenerated successfully!",
        mullions,
        glassPanels,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error regenerating grid:", error);
    return NextResponse.json(
      { message: "Error regenerating grid" },
      { status: 500 }
    );
  }
}

// PUT /api/openings/[id]/grid - Update grid parameters and regenerate
const updateGridSchema = z.object({
  columns: z.number().min(1).max(20),
  rows: z.number().min(1).max(20),
  mullionWidth: z.number().min(0.1).max(6),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  const openingId = parseInt(params.id, 10);
  if (isNaN(openingId)) {
    return NextResponse.json(
      { message: "Invalid opening ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsedData = updateGridSchema.parse(body);

    const result = await updateGridAndRegenerate(openingId, parsedData);
    const stats = await getGridStatistics(openingId);

    return NextResponse.json(
      {
        message: "Grid updated successfully!",
        opening: result.opening,
        mullions: result.mullions,
        glassPanels: result.glassPanels,
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating grid:", error);
    return NextResponse.json(
      { message: "Error updating grid" },
      { status: 500 }
    );
  }
}
