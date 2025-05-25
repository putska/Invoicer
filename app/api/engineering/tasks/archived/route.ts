// app/api/engineering/tasks/archived/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getArchivedTasks } from "../../../../db/actions";
import { authenticate } from "../../../../../app/api/admin/helpers"; // Removed unused 'authorize'

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    const tasks = await getArchivedTasks();
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Error fetching archived tasks:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching archived tasks" },
      { status: 500 }
    );
  }
}
