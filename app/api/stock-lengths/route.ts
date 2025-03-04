// app/api/stock-lengths/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../admin/helpers"; // Use your custom helper
import {
  getStockLengths,
  addStockLength,
  updateStockLength,
} from "../../../app/db/actions";

export async function GET(req: NextRequest) {
  try {
    // Get user ID from Clerk authentication
    const user = await authenticate(req);

    if (user instanceof NextResponse) {
      return user; // Return the error response
    }

    // Use user.id instead of userId
    const userId = user.id;

    const stockLengths = await getStockLengths(userId);
    return NextResponse.json(stockLengths);
  } catch (error) {
    console.error("Error fetching stock lengths:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error fetching stock lengths",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);

    if (user instanceof NextResponse) {
      return user; // Return the error response
    }

    // Use user.id instead of userId
    const userId = user.id;

    const data = await req.json();

    if (!data.part_no || !data.length1) {
      return NextResponse.json(
        { error: "Part number and primary length are required" },
        { status: 400 }
      );
    }

    const stockLength = await addStockLength({
      userId,
      partNo: data.part_no,
      finish: data.finish || "",
      length1: data.length1.toString(),
      length2: data.length2 ? data.length2.toString() : "0",
      qty1: data.qty1 || 1000,
      qty2: data.qty2 || 0,
    });

    return NextResponse.json(stockLength);
  } catch (error) {
    console.error("Error adding stock length:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error adding stock length",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // Get user ID from Clerk authentication
    const user = await authenticate(req);

    if (user instanceof NextResponse) {
      return user; // Return the error response
    }

    // Use user.id instead of userId
    const userId = user.id;

    const data = await req.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "Stock length ID is required" },
        { status: 400 }
      );
    }

    // Prepare update data, only including properties that are present
    const updateData: any = {};

    if (data.part_no !== undefined) updateData.partNo = data.part_no;
    if (data.finish !== undefined) updateData.finish = data.finish;
    if (data.length1 !== undefined)
      updateData.length1 = data.length1.toString();
    if (data.length2 !== undefined)
      updateData.length2 = data.length2.toString();
    if (data.qty1 !== undefined) updateData.qty1 = data.qty1;
    if (data.qty2 !== undefined) updateData.qty2 = data.qty2;

    const updatedStockLength = await updateStockLength(data.id, updateData);

    return NextResponse.json(updatedStockLength);
  } catch (error) {
    console.error("Error updating stock length:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error updating stock length",
      },
      { status: 500 }
    );
  }
}
