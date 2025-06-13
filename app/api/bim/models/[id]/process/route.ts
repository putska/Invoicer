// app/api/bim/models/[id]/process/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/app/api/admin/helpers";
import { saveBIMElements } from "@/app/db/actions";

const paramsSchema = z.object({
  id: z.string().transform(Number),
});

export async function POST(
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

    // TODO: Implement IFC processing logic here
    // This would use @thatopen/components to parse the uploaded file
    // and extract all the BIM elements and their properties

    const mockParseResult = {
      elements: [], // Would be populated by IFC processing
      metadata: {
        totalElements: 0,
        elementTypes: {},
        levels: [],
        materials: [],
        ifcSchema: "IFC4",
      },
    };

    const result = await saveBIMElements(modelId, mockParseResult);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/bim/models/[id]/process:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process IFC file" },
      { status: 500 }
    );
  }
}
