// app/api/engineering/tasks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getTasks, createTask } from "../../../db/actions";
import { authenticate } from "../../../../app/api/admin/helpers"; // Removed unused 'authorize'

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    const tasks = await getTasks();
    return NextResponse.json({ tasks });
  } catch (err) {
    console.error("Error fetching tasks:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching tasks" },
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
    const task = await createTask(body, user.id);

    return NextResponse.json({
      message: "Task created successfully",
      task,
    });
  } catch (err) {
    console.error("Error creating task:", err);
    return NextResponse.json(
      { message: "An error occurred while creating task" },
      { status: 500 }
    );
  }
}
