// app/api/engineering/tasks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateTask, deleteTask } from "../../../../db/actions";
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
    const task = await updateTask(parseInt(params.id), body, user.id);

    return NextResponse.json({
      message: "Task updated successfully",
      task,
    });
  } catch (err) {
    console.error("Error updating task:", err);
    return NextResponse.json(
      { message: "An error occurred while updating task" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) return; // Ensure user is an object with 'id'

    await deleteTask(parseInt(params.id), user.id);

    return NextResponse.json({
      message: "Task deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting task:", err);
    return NextResponse.json(
      { message: "An error occurred while deleting task" },
      { status: 500 }
    );
  }
}
