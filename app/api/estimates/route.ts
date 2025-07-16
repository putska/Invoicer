// app/api/estimates/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getAllEstimates,
  createEstimate,
  getEstimateWithBids,
  getEstimateById,
} from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";

// Zod schema for estimate creation
const createEstimateSchema = z.object({
  estimateNumber: z.string().min(1, "Estimate number is required"),
  name: z.string().min(1, "Name is required"),
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

// GET Route: Fetch all estimates or specific estimate with bids
export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Validate and parse query parameters
  const { searchParams } = new URL(req.url);
  const estimateIdParam = searchParams.get("estimateId");
  const includeBids = searchParams.get("includeBids") === "true";

  if (estimateIdParam) {
    // Get specific estimate with optional bids
    const estimateId = parseInt(estimateIdParam, 10);
    if (isNaN(estimateId)) {
      return NextResponse.json(
        { message: "Invalid estimate ID parameter" },
        { status: 400 }
      );
    }

    try {
      if (includeBids) {
        const estimate = await getEstimateById(estimateId);
        if (!estimate) {
          return NextResponse.json(
            { message: "Estimate not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ estimate }, { status: 200 });
      } else {
        const estimate = await getEstimateById(estimateId);
        if (!estimate) {
          return NextResponse.json(
            { message: "Estimate not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({ estimate }, { status: 200 });
      }
    } catch (error) {
      console.error("Error fetching estimate:", error);
      return NextResponse.json(
        { message: "Error fetching estimate" },
        { status: 500 }
      );
    }
  }

  // Get all estimates
  try {
    const estimatesList = await getAllEstimates();
    return NextResponse.json({ estimates: estimatesList }, { status: 200 });
  } catch (error) {
    console.error("Error fetching estimates:", error);
    return NextResponse.json(
      { message: "Error fetching estimates" },
      { status: 500 }
    );
  }
}

// POST Route: Create a new estimate
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
    const parsedData = createEstimateSchema.parse(body);

    // Convert date strings to Date objects if provided
    const estimateData = {
      ...parsedData,
      bidDate: parsedData.bidDate ? new Date(parsedData.bidDate) : undefined,
      projectStartDate: parsedData.projectStartDate
        ? new Date(parsedData.projectStartDate)
        : undefined,
      projectEndDate: parsedData.projectEndDate
        ? new Date(parsedData.projectEndDate)
        : undefined,
    };

    const newEstimate = await createEstimate(estimateData);
    return NextResponse.json(
      { message: "Estimate created successfully!", estimate: newEstimate },
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
    console.error("Error creating estimate:", error);
    return NextResponse.json(
      { message: "Error creating estimate" },
      { status: 500 }
    );
  }
}
