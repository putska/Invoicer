import { NextRequest, NextResponse } from "next/server";
import { getBIMElements } from "../../../../../db/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const modelId = parseInt(params.id);

    if (isNaN(modelId)) {
      return NextResponse.json({ error: "Invalid model ID" }, { status: 400 });
    }

    const elements = await getBIMElements(modelId);

    return NextResponse.json(elements);
  } catch (error) {
    console.error("Error fetching BIM elements:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
