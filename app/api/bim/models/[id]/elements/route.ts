// app/api/bim/models/[id]/elements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/app/api/admin/helpers";
import { getBIMElements } from "@/app/db/actions";

// Schema for validating query parameters
const querySchema = z.object({
  elementTypes: z.string().optional(),
  levels: z.string().optional(),
  page: z.string().transform(Number).optional(),
  pageSize: z.string().transform(Number).optional(),
});

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
    const paramsValidation = paramsSchema.safeParse({ id: params.id });
    if (!paramsValidation.success) {
      return NextResponse.json(
        { success: false, error: "Invalid model ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(req.url);
    const queryValidation = querySchema.safeParse({
      elementTypes: searchParams.get("elementTypes"),
      levels: searchParams.get("levels"),
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
    });

    if (!queryValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: queryValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const { id: modelId } = paramsValidation.data;
    const { elementTypes, levels, page, pageSize } = queryValidation.data;

    const filters = {
      elementTypes: elementTypes?.split(","),
      levels: levels?.split(","),
      page: page || 1,
      pageSize: pageSize || 100,
    };

    const result = await getBIMElements(modelId, filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/bim/models/[id]/elements:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch elements" },
      { status: 500 }
    );
  }
}
