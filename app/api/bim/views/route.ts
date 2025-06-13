// app/api/bim/views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/app/api/admin/helpers";
import { saveModelView, getModelViews } from "@/app/db/actions";

const createViewSchema = z.object({
  modelId: z.number(),
  viewName: z.string().min(1, "View name is required"),
  cameraPosition: z
    .object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
      targetX: z.number(),
      targetY: z.number(),
      targetZ: z.number(),
      upX: z.number().optional(),
      upY: z.number().optional(),
      upZ: z.number().optional(),
    })
    .optional(),
  visibleElements: z.array(z.number()).optional(),
  filters: z
    .object({
      elementTypes: z.array(z.string()).optional(),
      levels: z.array(z.string()).optional(),
      materials: z.array(z.string()).optional(),
    })
    .optional(),
  isPublic: z.boolean().optional().default(false),
});

const querySchema = z.object({
  modelId: z.string().transform(Number),
});

export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validate request body
    const validationResult = createViewSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid view data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const viewData = {
      ...validationResult.data,
      cameraPosition: validationResult.data.cameraPosition || null,
      visibleElements: validationResult.data.visibleElements || null,
      filters: validationResult.data.filters || null,
    };
    const result = await saveModelView(viewData);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/bim/views:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save view" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);

    // Validate query parameters
    const validationResult = querySchema.safeParse({
      modelId: searchParams.get("modelId"),
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Model ID is required",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { modelId } = validationResult.data;
    const views = await getModelViews(modelId);
    return NextResponse.json({ success: true, data: views });
  } catch (error) {
    console.error("Error in GET /api/bim/views:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch views" },
      { status: 500 }
    );
  }
}
