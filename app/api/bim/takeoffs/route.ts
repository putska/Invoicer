// app/aip / bim / takeoffs / route.ts;
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/app/api/admin/helpers";
import { createMaterialTakeoff } from "@/app/db/actions";

// Schema for validating takeoff creation
const createTakeoffSchema = z.object({
  modelId: z.number(),
  takeoffName: z.string().min(1, "Takeoff name is required"),
  description: z.string().optional(),
  rules: z
    .array(
      z.object({
        elementType: z.string(),
        materialCategory: z.string(),
        quantityProperty: z.string(),
        unit: z.string(),
        defaultUnitCost: z.number().optional(),
        calculationFormula: z.string().optional(),
      })
    )
    .optional()
    .default([]),
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
    const validationResult = createTakeoffSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid takeoff data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const result = await createMaterialTakeoff(validationResult.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in POST /api/bim/takeoffs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create takeoff" },
      { status: 500 }
    );
  }
}
