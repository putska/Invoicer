// app/api/openings/[id]/duplicate/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { duplicateOpening, generateGlassPanels } from "../../../../db/actions";
import { authenticate, authorize } from "../../../admin/helpers";

// Zod schema for duplicate request
const duplicateOpeningSchema = z.object({
  namePrefix: z.string().optional(),
  elevationId: z
    .number()
    .min(1, "Elevation ID must be a positive number")
    .optional(),
});

// POST Route: Duplicate an opening
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  // Validate opening ID
  const openingId = parseInt(params.id, 10);
  if (isNaN(openingId)) {
    return NextResponse.json(
      { message: "Invalid opening ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();
    const parsedData = duplicateOpeningSchema.parse(body);

    const duplicatedOpening = await duplicateOpening(
      openingId,
      parsedData.namePrefix
    );

    // Auto-generate initial glass panels for the duplicated opening
    await generateGlassPanels(duplicatedOpening.id);

    return NextResponse.json(
      {
        message: "Opening duplicated successfully!",
        original: { id: openingId },
        duplicate: duplicatedOpening,
        gridInfo: {
          columns: duplicatedOpening.gridColumns,
          rows: duplicatedOpening.gridRows,
          totalPanels:
            duplicatedOpening.gridColumns * duplicatedOpening.gridRows,
          mullionWidth: duplicatedOpening.mullionWidth,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Duplicate validation failed:", error.errors);
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error && error.message === "Opening not found") {
      return NextResponse.json(
        { message: "Original opening not found" },
        { status: 404 }
      );
    }

    console.error("Error duplicating opening:", error);
    return NextResponse.json(
      { message: "Error duplicating opening" },
      { status: 500 }
    );
  }
}
