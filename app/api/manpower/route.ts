import { NextRequest, NextResponse } from "next/server";
import {
  addManpower,
  updateManpower,
  getAllManpower,
  deleteManpower,
  findManpowerByActivityAndDate,
} from "../../../app/db/actions";
import { cookies } from "next/headers";
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly

// manpower is stored by activityId so we are just going to grab everything and then filter it out on the client side
export async function GET() {
  cookies();

  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  try {
    const manpowerData = await getAllManpower();
    return NextResponse.json({
      message: "Manpower data retrieved successfully!",
      manpowerData,
    });
  } catch (error) {
    console.error("Error fetching manpower data:", error);
    return NextResponse.json(
      { message: "An error occurred", error },
      { status: 500 }
    );
  }
}

// POST: Add or update manpower data
export async function POST(req: NextRequest) {
  try {
    const { activityId, date, manpower } = await req.json();

    // Check if the record already exists
    const existingRecord = await findManpowerByActivityAndDate(
      activityId,
      date
    );

    if (existingRecord) {
      // Update the existing record
      const response = await updateManpower(activityId, date, manpower);
      return NextResponse.json({ message: response.message }, { status: 200 });
    } else {
      // Add a new record
      const response = await addManpower(activityId, date, manpower);
      return NextResponse.json({ message: response.message }, { status: 201 });
    }
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      { message: "Failed to add or update manpower data" },
      { status: 500 }
    );
  }
}

// PUT route to update manpower data
export async function PUT(req: NextRequest) {
  try {
    const { activityId, date, manpower } = await req.json();

    const response = await updateManpower(activityId, date, manpower);
    return NextResponse.json({ message: response.message }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to update manpower data" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const activityId = parseInt(req.nextUrl.searchParams.get("activityId") || "");
  const date = req.nextUrl.searchParams.get("date") || "";

  if (!activityId || !date) {
    return NextResponse.json(
      { message: "Missing activityId or date parameter" },
      { status: 400 }
    );
  }
  try {
    await deleteManpower(activityId, date);
    return NextResponse.json(
      { message: "Manpower deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting manpower:", error);
    return NextResponse.json(
      { message: "Failed to delete manpower data" },
      { status: 500 }
    );
  }
}
