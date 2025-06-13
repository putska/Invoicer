// app/api/bim/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  createModelComment,
  getModelComments,
  updateCommentStatus,
} from "../../../db/actions";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createModelComment(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = parseInt(searchParams.get("modelId")!);

    const comments = await getModelComments(modelId);
    return NextResponse.json({ success: true, data: comments });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
