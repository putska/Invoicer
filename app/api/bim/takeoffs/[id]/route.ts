// app/api/bim/takeoffs/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/app/api/admin/helpers";
import { getTakeoffWithItems, updateTakeoffStatus } from "@/app/db/actions";

const paramsSchema = z.object({
  id: z.string().transform(Number),
});

const updateStatusSchema = z.object({
  status: z.enum(["draft", "approved", "exported"]),
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
        { success: false, error: "Invalid takeoff ID" },
        { status: 400 }
      );
    }

    const { id: takeoffId } = validationResult.data;
    const result = await getTakeoffWithItems(takeoffId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in GET /api/bim/takeoffs/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch takeoff" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
        { success: false, error: "Invalid takeoff ID" },
        { status: 400 }
      );
    }

    const body = await req.json();

    // Validate request body
    const bodyValidation = updateStatusSchema.safeParse(body);
    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid status data",
          details: bodyValidation.error.issues,
        },
        { status: 400 }
      );
    }

    const { id: takeoffId } = paramsValidation.data;
    const { status } = bodyValidation.data;

    const result = await updateTakeoffStatus(takeoffId, status);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in PATCH /api/bim/takeoffs/[id]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update takeoff" },
      { status: 500 }
    );
  }
}
