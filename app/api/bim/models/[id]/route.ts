// app/api/bim/models/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/app/api/admin/helpers";
import { getBIMModel, deleteBIMModel } from "@/app/db/actions";

// Schema for validating route parameters
const paramsSchema = z.object({
  id: z.string().transform(Number),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate params
    const validationResult = paramsSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid model ID" },
        { status: 400 }
      );
    }

    const { id: modelId } = validationResult.data;
    const model = await getBIMModel(modelId);

    if (!model) {
      return NextResponse.json(
        { success: false, error: "Model not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: model });
  } catch (error) {
    console.error("Error in GET /api/bim/models/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch model" },
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
    if (!user || !("id" in user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate params
    const validationResult = paramsSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid model ID" },
        { status: 400 }
      );
    }

    const { id: modelId } = validationResult.data;
    const result = await deleteBIMModel(modelId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in DELETE /api/bim/models/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete model" },
      { status: 500 }
    );
  }
}
