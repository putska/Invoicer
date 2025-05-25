import { NextRequest, NextResponse } from "next/server";
import { getEngineers, createEngineer } from "../../../db/actions";
import { authenticate } from "../../../../app/api/admin/helpers"; // Removed unused 'authorize'

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    const engineers = await getEngineers();
    return NextResponse.json({ engineers });
  } catch (err) {
    console.error("Error fetching engineers:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching engineers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    const body = await req.json();
    const engineer = await createEngineer(body, user.id);

    return NextResponse.json({
      message: "Engineer created successfully",
      engineer,
    });
  } catch (err) {
    console.error("Error creating engineer:", err);
    return NextResponse.json(
      { message: "An error occurred while creating engineer" },
      { status: 500 }
    );
  }
}
