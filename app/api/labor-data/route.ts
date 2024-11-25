import { NextRequest, NextResponse } from "next/server";
import { addLaborData, getLaborDataByProject } from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";
import { LaborData } from "../../types";

// GET all labor data entries (for debugging or admin use)
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate();
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
    const user = await authenticate();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const laborDataEntry: LaborData = await req.json();
    await addLaborData(laborDataEntry);
    return NextResponse.json(
      { message: "Labor data added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding labor data:", error);
    return NextResponse.json(
      { message: "Failed to add labor data" },
      { status: 500 }
    );
  }
}
