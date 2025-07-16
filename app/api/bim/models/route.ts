// app/api/bim/models/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getBIMModels } from "../../../db/actions";

export async function GET(request: NextRequest) {
  try {
    const models = await getBIMModels();

    return NextResponse.json({
      success: true,
      data: models,
    });
  } catch (error) {
    console.error("Error fetching BIM models:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
