import { NextRequest, NextResponse } from "next/server";
import { getAllRequests, addRequest } from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";
import { Request } from "../../types";

// GET all requests
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

    const requests = await getAllRequests();
    return NextResponse.json({
      message: "Requests retrieved successfully",
      requests,
    });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { message: "Failed to retrieve requests" },
      { status: 500 }
    );
  }
}

// POST: Add a new request
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

    const request: Omit<Request, "id" | "createdAt" | "updatedAt"> =
      await req.json();
    await addRequest(request);
    return NextResponse.json(
      { message: "Request added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding request:", error);
    return NextResponse.json(
      { message: "Failed to add request" },
      { status: 500 }
    );
  }
}
