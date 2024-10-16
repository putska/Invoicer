// /app/api/purchasing/project/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getPOsByJobNumber } from "../../../../db/actions";
import { authenticate, authorize } from "../../../admin/helpers";

// Utility function to parse job number from params
const parseJobNumber = (params: { id: string }) => params.id;

// GET all purchase orders for a specific project (by job number)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobNumber = parseJobNumber(params);
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

    // Fetch purchase orders by job number
    const purchaseOrders = await getPOsByJobNumber(jobNumber);

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
          message: `No purchase orders found for job number: ${jobNumber}`,
        },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error("Error fetching purchase orders by job number:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching purchase orders" },
      { status: 500 }
    );
  }
}
