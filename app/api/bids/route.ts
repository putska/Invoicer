// app/api/bids/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getBidsByEstimateId,
  createBid,
  getBidWithElevations,
  calculateBidSummary,
  getBidById,
} from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";

// Zod schema for bid creation
const createBidSchema = z.object({
  estimateId: z.number().min(1, "Estimate ID must be a positive number"),
  bidNumber: z.string().min(1, "Bid number is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  stage: z
    .enum([
      "initial_budget",
      "hard_budget",
      "initial_pricing",
      "firm_estimate",
      "final_bid",
    ])
    .optional(),
  parentBidId: z.number().optional(),
  preparedBy: z.string().optional(),
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
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  sortOrder: z.number().optional(),
});

// GET Route: Fetch bids for an estimate or specific bid with elevations
export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Validate and parse query parameters
  const { searchParams } = new URL(req.url);
  const estimateIdParam = searchParams.get("estimateId");
  const bidIdParam = searchParams.get("bidId");
  const includeElevations = searchParams.get("includeElevations") === "true";
  const includeSummary = searchParams.get("includeSummary") === "true";

  if (bidIdParam) {
    // Get specific bid with optional elevations and summary
    const bidId = parseInt(bidIdParam, 10);
    if (isNaN(bidId)) {
      return NextResponse.json(
        { message: "Invalid bid ID parameter" },
        { status: 400 }
      );
    }

    try {
      if (includeElevations) {
        const bid = await getBidWithElevations(bidId);
        if (!bid) {
          return NextResponse.json(
            { message: "Bid not found" },
            { status: 404 }
          );
        }

        let summary = null;
        if (includeSummary) {
          summary = await calculateBidSummary(bidId);
        }

        return NextResponse.json(
          {
            bid,
            summary,
          },
          { status: 200 }
        );
      } else {
        const bid = await getBidById(bidId);
        if (!bid) {
          return NextResponse.json(
            { message: "Bid not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ bid }, { status: 200 });
      }
    } catch (error) {
      console.error("Error fetching bid:", error);
      return NextResponse.json(
        { message: "Error fetching bid" },
        { status: 500 }
      );
    }
  }

  if (estimateIdParam) {
    // Get all bids for an estimate
    const estimateId = parseInt(estimateIdParam, 10);
    if (isNaN(estimateId)) {
      return NextResponse.json(
        { message: "Invalid estimate ID parameter" },
        { status: 400 }
      );
    }

    try {
      const bidsList = await getBidsByEstimateId(estimateId);
      return NextResponse.json({ bids: bidsList }, { status: 200 });
    } catch (error) {
      console.error("Error fetching bids:", error);
      return NextResponse.json(
        { message: "Error fetching bids" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { message: "Either estimateId or bidId parameter is required" },
    { status: 400 }
  );
}

// POST Route: Create a new bid
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
    const parsedData = createBidSchema.parse(body);

    // Convert date strings to Date objects if provided
    const bidData = {
      ...parsedData,
      proposedStartDate: parsedData.proposedStartDate
        ? new Date(parsedData.proposedStartDate)
        : undefined,
      proposedCompletionDate: parsedData.proposedCompletionDate
        ? new Date(parsedData.proposedCompletionDate)
        : undefined,
    };

    const newBid = await createBid(bidData);

    return NextResponse.json(
      { message: "Bid created successfully!", bid: newBid },
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
    console.error("Error creating bid:", error);
    return NextResponse.json(
      { message: "Error creating bid" },
      { status: 500 }
    );
  }
}
