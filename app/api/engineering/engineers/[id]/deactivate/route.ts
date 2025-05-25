// app/api/engineering/engineers/[id]/deactivate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { deactivateEngineer } from "../../../../../db/actions";
import { authenticate } from "../../../../../../app/api/admin/helpers"; // Removed unused 'authorize'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    await deactivateEngineer(parseInt(params.id));

    return NextResponse.json({
      message: "Engineer deactivated successfully",
    });
  } catch (err) {
    console.error("Error deactivating engineer:", err);
    return NextResponse.json(
      { message: "An error occurred while deactivating engineer" },
      { status: 500 }
    );
  }
}
