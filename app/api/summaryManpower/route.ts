import { getAverageManpowerByMonthAndYear } from "../../../app/db/actions";
import { NextRequest, NextResponse } from "next/server";
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly

export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) return; // Response already sent in authenticate()

  try {
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
