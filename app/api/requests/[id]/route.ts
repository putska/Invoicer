import { NextRequest, NextResponse } from "next/server";
import {
  getRequestById,
  updateRequest,
  deleteRequest,
} from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// GET a specific request by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "read"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const request = await getRequestById(parseInt(id, 10));
    return request
      ? NextResponse.json(request)
      : NextResponse.json({ message: "Request not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching request by ID:", error);
    return NextResponse.json(
      { message: "Failed to retrieve request" },
      { status: 500 }
    );
  }
}

// PUT: Update a specific request
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "read"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updatedData = await req.json();
    console.log("Updated data:", updatedData);
    const requestUpdate = await updateRequest(parseInt(id, 10), updatedData);
    console.log("Request update:", requestUpdate);
    return NextResponse.json({ message: "Request updated successfully" });
  } catch (error) {
    console.error("Error updating request:", error);
    return NextResponse.json(
      { message: "Failed to update request" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific request
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await deleteRequest(parseInt(id, 10));
    return NextResponse.json({ message: "Request deleted successfully" });
  } catch (error) {
    console.error("Error deleting request:", error);
    return NextResponse.json(
      { message: "Failed to delete request" },
      { status: 500 }
    );
  }
}
