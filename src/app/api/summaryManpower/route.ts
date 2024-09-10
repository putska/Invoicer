import { getAverageManpowerByMonthAndYear } from "@/app/db/actions";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("Fetching average manpower...");
    const data = await getAverageManpowerByMonthAndYear();
    return NextResponse.json(
      { message: "Average manpower retrieved successfully!", data },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error fetching average manpower:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { message: "An error occurred", error: errorMessage },
      { status: 400 }
    );
  }
}
