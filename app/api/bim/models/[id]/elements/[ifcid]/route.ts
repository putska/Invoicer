// app/api/bim/elements/[ifcId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getBIMElementByIfcId } from "../../../../../../db/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: { ifcId: string } }
) {
  try {
    const { ifcId } = params;

    if (!ifcId) {
      return NextResponse.json(
        { error: "IFC ID is required" },
        { status: 400 }
      );
    }

    const element = await getBIMElementByIfcId(ifcId);

    if (!element) {
      return NextResponse.json({ error: "Element not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: element,
    });
  } catch (error) {
    console.error("Error fetching BIM element:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
