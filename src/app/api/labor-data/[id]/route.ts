import { NextRequest, NextResponse } from "next/server";
import {
  getSingleLaborData,
  updateLaborData,
  deleteLaborData,
} from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// GET a specific labor data entry by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = await authenticate();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const laborData = await getSingleLaborData(parseInt(id, 10));
    return laborData
      ? NextResponse.json(laborData)
      : NextResponse.json({ message: "Labor data not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching labor data by ID:", error);
    return NextResponse.json(
      { message: "Failed to retrieve labor data" },
      { status: 500 }
    );
  }
}

// PUT: Update a specific labor data entry by ID
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = await authenticate();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updatedData = await req.json();
    await updateLaborData(parseInt(id, 10), updatedData);
    return NextResponse.json({ message: "Labor data updated successfully" });
  } catch (error) {
    console.error("Error updating labor data:", error);
    return NextResponse.json(
      { message: "Failed to update labor data" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific labor data entry by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = await authenticate();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await deleteLaborData(parseInt(id, 10));
    return NextResponse.json({ message: "Labor data deleted successfully" });
  } catch (error) {
    console.error("Error deleting labor data:", error);
    return NextResponse.json(
      { message: "Failed to delete labor data" },
      { status: 500 }
    );
  }
}
