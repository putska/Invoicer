// /app/api/purchasing/project/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getPOsByJobId } from "../../../../db/actions"; // Updated function
import { authenticate, authorize } from "../../../admin/helpers";

// Utility function to parse job ID from params
const parseJobId = (params: { id: string }) => parseInt(params.id, 10);

// GET all purchase orders for a specific project (by job ID)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = parseJobId(params); // Parse job ID as an integer

  try {
    // Authenticate the user
    const user = await authenticate();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Authorize the user
    const isAuthorized = authorize(user, ["admin", "read"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Fetch purchase orders by job ID
    const purchaseOrders = await getPOsByJobId(jobId); // Updated function call

    if (purchaseOrders.length > 0) {
      return NextResponse.json(
        {
          message: "Purchase orders retrieved successfully!",
          purchaseOrders,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          message: `No purchase orders found for job ID: ${jobId}`,
        },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error("Error fetching purchase orders by job ID:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching purchase orders" },
      { status: 500 }
    );
  }
}
