import { NextRequest, NextResponse } from "next/server";
import {
  addLaborData,
  getLaborDataByProject,
  getLaborDataByUniqueFields,
} from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";
import { LaborData } from "../../types";
import { z } from "zod";

const laborDataSchema = z.object({
  eid: z.number(),
  date: z.string(),
  jobNumber: z.string(),
  hours: z.number(),
  costCodeNumber: z.string(),
  // Add other fields as needed
});

// GET all labor data entries (for debugging or admin use)
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "read"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const jobNumber = req.nextUrl.searchParams.get("jobNumber");
    if (jobNumber) {
      const laborData = await getLaborDataByProject(jobNumber);
      return NextResponse.json({
        message: "Data retrieved successfully",
        laborData,
      });
    }

    return NextResponse.json(
      { message: "Project ID is required" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error fetching labor data:", error);
    return NextResponse.json(
      { message: "Failed to retrieve data" },
      { status: 500 }
    );
  }
}

// POST: Add new labor data
export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // const body = await req.json();

    const laborDataEntry: LaborData = await req.json();
    // Validate using Zod
    const laborDataEntryTest = laborDataSchema.parse(laborDataEntry);

    if (laborDataEntryTest.hours < 0) {
      const existingRecord = await getLaborDataByUniqueFields(
        laborDataEntryTest.eid,
        laborDataEntryTest.date,
        laborDataEntryTest.jobNumber,
        laborDataEntryTest.costCodeNumber,
        laborDataEntryTest.hours
      );

      if (existingRecord && existingRecord.length > 0) {
        return NextResponse.json(
          { message: "Duplicate record detected", existingRecord },
          { status: 409 }
        );
      }
    }

    await addLaborData(laborDataEntry);
    return NextResponse.json(
      { message: "Labor data added successfully" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    console.error("Error adding labor data:", error);
    return NextResponse.json(
      { message: "Failed to add labor data" },
      { status: 500 }
    );
  }
}
