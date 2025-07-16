import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getGridConfigurationsByOpening,
  saveGridConfiguration,
} from "../../../../../db/actions";
import { authenticate, authorize } from "../../../../admin/helpers";

const saveConfigSchema = z.object({
  name: z.string().min(1, "Configuration name is required"),
  description: z.string().optional(),
});

// GET /api/openings/[id]/grid/configurations
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const openingId = parseInt(params.id, 10);
  if (isNaN(openingId)) {
    return NextResponse.json(
      { message: "Invalid opening ID" },
      { status: 400 }
    );
  }

  try {
    const configurations = await getGridConfigurationsByOpening(openingId);
    return NextResponse.json({ configurations }, { status: 200 });
  } catch (error) {
    console.error("Error fetching configurations:", error);
    return NextResponse.json(
      { message: "Error fetching configurations" },
      { status: 500 }
    );
  }
}

// POST /api/openings/[id]/grid/configurations - Save current grid as configuration
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  const openingId = parseInt(params.id, 10);
  if (isNaN(openingId)) {
    return NextResponse.json(
      { message: "Invalid opening ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsedData = saveConfigSchema.parse(body);

    const configuration = await saveGridConfiguration(
      openingId,
      parsedData.name,
      parsedData.description,
      "Unknown User"
    );

    return NextResponse.json(
      {
        message: "Configuration saved successfully!",
        configuration,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error saving configuration:", error);
    return NextResponse.json(
      { message: "Error saving configuration" },
      { status: 500 }
    );
  }
}
