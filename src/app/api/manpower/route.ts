import { NextRequest, NextResponse } from "next/server";
import { addManpower, updateManpower, getAllManpower } from "@/app/db/actions";

// manpower is stored by activityId so we are just going to grab everything and then filter it out on the client side
export async function GET() {
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

// POST route to add manpower data
export async function POST(req: NextRequest) {
  try {
    const { activityId, date, manpower } = await req.json();

    const response = await addManpower(activityId, date, manpower);
    return NextResponse.json({ message: response.message }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to add manpower data" },
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