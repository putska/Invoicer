// /api/requests/batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { addRequest } from "../../../db/actions"; // Ensure you have this action
import { authenticate, authorize } from "../../admin/helpers";

export async function POST(req: NextRequest) {
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "read"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const user = await authenticate();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const cartItems = await req.json(); // Expect an array of requisitions

    // Loop through each item and insert it into the requisitions table
    for (const item of cartItems) {
      await addRequest({
        materialId: item.materialId,
        quantity: item.quantity,
        requestedBy: item.requestedBy,
        status: item.status || "requested",
        jobId: item.jobId,
        comments: item.comments || "",
      });
    }

    return NextResponse.json(
      { message: "Requisitions added successfully!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding requisitions:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "Failed to add requisitions", error: errorMessage },
      { status: 500 }
    );
  }
}
