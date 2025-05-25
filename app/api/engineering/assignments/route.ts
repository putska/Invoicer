// app/api/engineering/assignments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { assignTask, moveTask } from "../../../db/actions";
import { authenticate } from "../../../../app/api/admin/helpers"; // Removed unused 'authorize'

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    const body = await req.json();

    if (body.action === "assign") {
      const assignment = await assignTask(
        body.taskId,
        body.engineerId,
        body.position,
        user.id
      );
      return NextResponse.json({
        message: "Task assigned successfully",
        assignment,
      });
    } else if (body.action === "move") {
      await moveTask(body.moveData, user.id);
      return NextResponse.json({
        message: "Task moved successfully",
      });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Error handling assignment:", err);
    return NextResponse.json(
      { message: "An error occurred while handling assignment" },
      { status: 500 }
    );
  }
}
