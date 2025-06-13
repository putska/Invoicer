// app/api/bim/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateCommentStatus } from "../../../../db/actions";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const commentId = parseInt(params.id);
    const { status } = await request.json();

    const result = await updateCommentStatus(commentId, status);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update comment" },
      { status: 500 }
    );
  }
}
