// app/api/bids/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  updateBid,
  deleteBid,
  getBidById,
  setActiveBid,
} from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// Zod schema for bid updates
const updateBidSchema = z.object({
  bidNumber: z.string().min(1, "Bid number is required").optional(),
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  stage: z
    .enum([
      "initial_budget",
      "hard_budget",
      "initial_pricing",
      "firm_estimate",
      "final_bid",
      "submitted",
    ])
    .optional(),
  preparedBy: z.string().optional(),
  reviewedBy: z.string().optional(),
  approvedBy: z.string().optional(),
  submittedDate: z.string().datetime().optional(),
  totalMaterialCost: z.number().min(0).optional(),
  totalLaborCost: z.number().min(0).optional(),
  totalSubcontractorCost: z.number().min(0).optional(),
  totalEquipmentCost: z.number().min(0).optional(),
  totalOverheadCost: z.number().min(0).optional(),
  totalProfitAmount: z.number().min(0).optional(),
  totalBidAmount: z.number().min(0).optional(),
  overheadPercentage: z.number().min(0).max(100).optional(),
  profitPercentage: z.number().min(0).max(100).optional(),
  contingencyPercentage: z.number().min(0).max(100).optional(),
  proposedStartDate: z.string().datetime().optional(),
  proposedCompletionDate: z.string().datetime().optional(),
  deliveryWeeks: z.number().min(0).optional(),
  alternateRequested: z.boolean().optional(),
  alternateDescription: z.string().optional(),
  valueEngineeringNotes: z.string().optional(),
  exclusions: z.string().optional(),
  assumptions: z.string().optional(),
  isActive: z.boolean().optional(),
  isSubmitted: z.boolean().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  sortOrder: z.number().optional(),
});

// PUT Route: Update a bid
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

  const bidId = parseInt(params.id, 10);
  if (isNaN(bidId)) {
    return NextResponse.json({ message: "Invalid bid ID" }, { status: 400 });
  }

  try {
    // Check if bid exists
    const existingBid = await getBidById(bidId);
    if (!existingBid) {
      return NextResponse.json({ message: "Bid not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsedData = updateBidSchema.parse(body);

    // Convert date strings to Date objects if provided
    const updateData = {
      ...parsedData,
      submittedDate: parsedData.submittedDate
        ? new Date(parsedData.submittedDate)
        : undefined,
      proposedStartDate: parsedData.proposedStartDate
        ? new Date(parsedData.proposedStartDate)
        : undefined,
      proposedCompletionDate: parsedData.proposedCompletionDate
        ? new Date(parsedData.proposedCompletionDate)
        : undefined,
    };

    const updatedBid = await updateBid(bidId, updateData);

    // If setting this bid as active, handle the active bid logic
    if (parsedData.isActive === true) {
      await setActiveBid(bidId);
    }

    return NextResponse.json(
      { message: "Bid updated successfully!", bid: updatedBid },
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
    console.error("Error updating bid:", error);
    return NextResponse.json(
      { message: "Error updating bid" },
      { status: 500 }
    );
  }
}

// DELETE Route: Delete a bid
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

  const bidId = parseInt(params.id, 10);
  if (isNaN(bidId)) {
    return NextResponse.json({ message: "Invalid bid ID" }, { status: 400 });
  }

  try {
    // Check if bid exists
    const existingBid = await getBidById(bidId);
    if (!existingBid) {
      return NextResponse.json({ message: "Bid not found" }, { status: 404 });
    }

    await deleteBid(bidId);
    return NextResponse.json(
      { message: "Bid deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting bid:", error);
    return NextResponse.json(
      { message: "Error deleting bid" },
      { status: 500 }
    );
  }
}
