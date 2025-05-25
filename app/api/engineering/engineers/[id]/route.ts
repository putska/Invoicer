// app/api/engineering/engineers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateEngineer } from "../../../../db/actions";
import { authenticate } from "../../../../../app/api/admin/helpers"; // Removed unused 'authorize'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    const body = await req.json();
    const engineer = await updateEngineer(parseInt(params.id), body);

    return NextResponse.json({
      message: "Engineer updated successfully",
      engineer,
    });
  } catch (err) {
    console.error("Error updating engineer:", err);
    return NextResponse.json(
      { message: "An error occurred while updating engineer" },
      { status: 500 }
    );
  }
}
