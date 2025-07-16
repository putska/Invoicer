// app/api/estimates/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  updateEstimate,
  deleteEstimate,
  getEstimateById,
} from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// Zod schema for estimate updates
const updateEstimateSchema = z.object({
  estimateNumber: z.string().min(1, "Estimate number is required").optional(),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  buildingType: z.string().optional(),
  location: z.string().optional(),
  architect: z.string().optional(),
  contractor: z.string().optional(),
  owner: z.string().optional(),
  bidDate: z.string().datetime().optional(),
  projectStartDate: z.string().datetime().optional(),
  projectEndDate: z.string().datetime().optional(),
  totalSquareFootage: z.number().min(0).optional(),
  storiesBelowGrade: z.number().min(0).optional(),
  storiesAboveGrade: z.number().min(1).optional(),
  status: z
    .enum([
      "active",
      "on_hold",
      "bid_submitted",
      "awarded",
      "lost",
      "cancelled",
      "no_bid",
    ])
    .optional(),
  estimatedValue: z.number().min(0).optional(),
  confidenceLevel: z.enum(["high", "medium", "low"]).optional(),
  competitionLevel: z.enum(["high", "medium", "low"]).optional(),
  relationshipStatus: z.string().optional(),
  primaryContact: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  assignedEstimator: z.string().optional(),
  salesPerson: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  sortOrder: z.number().optional(),
});

// PUT Route: Update an estimate
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

  const estimateId = parseInt(params.id, 10);
  if (isNaN(estimateId)) {
    return NextResponse.json(
      { message: "Invalid estimate ID" },
      { status: 400 }
    );
  }

  try {
    // Check if estimate exists
    const existingEstimate = await getEstimateById(estimateId);
    if (!existingEstimate) {
      return NextResponse.json(
        { message: "Estimate not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsedData = updateEstimateSchema.parse(body);

    // Convert date strings to Date objects if provided
    const updateData = {
      ...parsedData,
      bidDate: parsedData.bidDate ? new Date(parsedData.bidDate) : undefined,
      projectStartDate: parsedData.projectStartDate
        ? new Date(parsedData.projectStartDate)
        : undefined,
      projectEndDate: parsedData.projectEndDate
        ? new Date(parsedData.projectEndDate)
        : undefined,
    };

    const updatedEstimate = await updateEstimate(estimateId, updateData);
    return NextResponse.json(
      { message: "Estimate updated successfully!", estimate: updatedEstimate },
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
    console.error("Error updating estimate:", error);
    return NextResponse.json(
      { message: "Error updating estimate" },
      { status: 500 }
    );
  }
}

// DELETE Route: Delete an estimate
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

  const estimateId = parseInt(params.id, 10);
  if (isNaN(estimateId)) {
    return NextResponse.json(
      { message: "Invalid estimate ID" },
      { status: 400 }
    );
  }

  try {
    // Check if estimate exists
    const existingEstimate = await getEstimateById(estimateId);
    if (!existingEstimate) {
      return NextResponse.json(
        { message: "Estimate not found" },
        { status: 404 }
      );
    }

    await deleteEstimate(estimateId);
    return NextResponse.json(
      { message: "Estimate deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting estimate:", error);
    return NextResponse.json(
      { message: "Error deleting estimate" },
      { status: 500 }
    );
  }
}
