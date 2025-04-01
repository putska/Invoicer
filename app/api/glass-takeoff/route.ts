import { NextRequest, NextResponse } from "next/server";
import { processGlassTakeoff } from "../../db/actions";

export async function POST(request: NextRequest) {
  try {
    console.log("Processing glass takeoff request");
    const data = await request.json();

    // Use the server action to process the glass takeoff
    const processedGlass = await processGlassTakeoff(data);

    return NextResponse.json(processedGlass);
  } catch (error) {
    console.error("Error in glass takeoff API route:", error);
    return NextResponse.json(
      { error: "Failed to process glass takeoff" },
      { status: 500 }
    );
  }
}
