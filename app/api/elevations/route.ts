// app/api/elevations/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getElevationsByBidId,
  createElevation,
  getElevationWithOpenings,
  calculateElevationSummary,
  getElevationsByBidIdWithOpenings,
} from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";

// Zod schema for elevation creation
const createElevationSchema = z.object({
  bidId: z.number().min(1, "Bid ID must be a positive number"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  elevationType: z
    .enum([
      "storefront",
      "curtain_wall",
      "window_wall",
      "entrance",
      "canopy",
      "mixed",
    ])
    .optional(),
  totalWidth: z.number().min(0.1, "Total width must be greater than 0"),
  totalHeight: z.number().min(0.1, "Total height must be greater than 0"),
  floorHeight: z.number().min(0, "Floor height must be non-negative"),
  floorNumber: z.number().min(1).optional(),
  drawingNumber: z.string().optional(),
  drawingRevision: z.string().optional(),
  gridLine: z.string().optional(),
  detailReference: z.string().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().optional(),
});

// GET Route: Fetch elevations for a bid or specific elevation with details
export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Validate and parse query parameters
  const { searchParams } = new URL(req.url);
  const bidIdParam = searchParams.get("bidId");
  const elevationIdParam = searchParams.get("elevationId");
  const includeDetails = searchParams.get("includeDetails") === "true";
  const includeSummary = searchParams.get("includeSummary") === "true";

  if (elevationIdParam) {
    // Get specific elevation with details
    const elevationId = parseInt(elevationIdParam, 10);
    if (isNaN(elevationId)) {
      return NextResponse.json(
        { message: "Invalid elevation ID parameter" },
        { status: 400 }
      );
    }

    try {
      const elevation = await getElevationWithOpenings(elevationId);
      if (!elevation) {
        return NextResponse.json(
          { message: "Elevation not found" },
          { status: 404 }
        );
      }

      let summary = null;
      if (includeSummary) {
        summary = await calculateElevationSummary(elevationId);
      }

      return NextResponse.json(
        {
          elevation,
          summary,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error fetching elevation:", error);
      return NextResponse.json(
        { message: "Error fetching elevation" },
        { status: 500 }
      );
    }
  }

  if (bidIdParam) {
    // Get all elevations for a bid
    const bidId = parseInt(bidIdParam, 10);
    if (isNaN(bidId)) {
      return NextResponse.json(
        { message: "Invalid bid ID parameter" },
        { status: 400 }
      );
    }

    try {
      let elevationsList;

      if (includeDetails) {
        // Use the function that includes openings and details
        elevationsList = await getElevationsByBidIdWithOpenings(bidId);
      } else {
        // Use simpler function for basic elevation data
        elevationsList = await getElevationsByBidId(bidId);
      }

      return NextResponse.json({ elevations: elevationsList }, { status: 200 });
    } catch (error) {
      console.error("Error fetching elevations:", error);
      return NextResponse.json(
        { message: "Error fetching elevations" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { message: "Either bidId or elevationId parameter is required" },
    { status: 400 }
  );
}

// POST Route: Create a new elevation
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
    const parsedData = createElevationSchema.parse(body);

    const newElevation = await createElevation(parsedData);
    return NextResponse.json(
      { message: "Elevation created successfully!", elevation: newElevation },
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
    console.error("Error creating elevation:", error);
    return NextResponse.json(
      { message: "Error creating elevation" },
      { status: 500 }
    );
  }
}
