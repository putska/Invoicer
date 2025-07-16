import { NextRequest, NextResponse } from "next/server";
import { getBIMModel, getBIMElements } from "../../../../db/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const modelId = parseInt(params.id);

    if (isNaN(modelId)) {
      return NextResponse.json({ error: "Invalid model ID" }, { status: 400 });
    }

    const model = await getBIMModel(modelId);

    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 });
    }

    return NextResponse.json(model);
  } catch (error) {
    console.error("Error fetching BIM model:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
