// app/api/elevations/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  updateElevation,
  deleteElevation,
  getElevationById,
} from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// Zod schema for elevation updates
const updateElevationSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
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
  totalWidth: z
    .number()
    .min(0.1, "Total width must be greater than 0")
    .optional(),
  totalHeight: z
    .number()
    .min(0.1, "Total height must be greater than 0")
    .optional(),
  floorHeight: z
    .number()
    .min(0, "Floor height must be non-negative")
    .optional(),
  floorNumber: z.number().min(1).optional(),
  drawingNumber: z.string().optional(),
  drawingRevision: z.string().optional(),
  gridLine: z.string().optional(),
  detailReference: z.string().optional(),
  materialCost: z.number().min(0).optional(),
  laborCost: z.number().min(0).optional(),
  totalCost: z.number().min(0).optional(),
  notes: z.string().optional(),
  sortOrder: z.number().optional(),
});

// PUT Route: Update an elevation
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  const elevationId = parseInt(params.id, 10);
  if (isNaN(elevationId)) {
    return NextResponse.json(
      { message: "Invalid elevation ID" },
      { status: 400 }
    );
  }

  try {
    // Check if elevation exists
    const existingElevation = await getElevationById(elevationId);
    if (!existingElevation) {
      return NextResponse.json(
        { message: "Elevation not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsedData = updateElevationSchema.parse(body);

    const updatedElevation = await updateElevation(elevationId, parsedData);
    return NextResponse.json(
      {
        message: "Elevation updated successfully!",
        elevation: updatedElevation,
      },
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
    console.error("Error updating elevation:", error);
    return NextResponse.json(
      { message: "Error updating elevation" },
      { status: 500 }
    );
  }
}

// DELETE Route: Delete an elevation
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  const elevationId = parseInt(params.id, 10);
  if (isNaN(elevationId)) {
    return NextResponse.json(
      { message: "Invalid elevation ID" },
      { status: 400 }
    );
  }

  try {
    // Check if elevation exists
    const existingElevation = await getElevationById(elevationId);
    if (!existingElevation) {
      return NextResponse.json(
        { message: "Elevation not found" },
        { status: 404 }
      );
    }

    await deleteElevation(elevationId);
    return NextResponse.json(
      { message: "Elevation deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting elevation:", error);
    return NextResponse.json(
      { message: "Error deleting elevation" },
      { status: 500 }
    );
  }
}
