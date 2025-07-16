// app/api/openings/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getOpeningById,
  updateOpening,
  deleteOpening,
} from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// Zod schema for opening updates (all fields optional)
const updateOpeningSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  openingMark: z.string().optional(),
  startPosition: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val >= 0, "Start position must be non-negative")
    .optional(),
  width: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val > 0, "Width must be greater than 0")
    .optional(),
  height: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val > 0, "Height must be greater than 0")
    .optional(),
  sillHeight: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val >= 0, "Sill height must be non-negative")
    .optional(),
  openingType: z
    .enum([
      "storefront",
      "curtain_wall",
      "window",
      "door",
      "entrance_door",
      "fixed_window",
      "operable_window",
      "ribbon_window",
      "clerestory",
      "vent",
      "louver",
    ])
    .optional(),
  glazingSystem: z.string().optional(),
  hasTransom: z.boolean().optional(),
  transomHeight: z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((val) => {
      if (val === null || val === undefined || val === "") return undefined;
      return typeof val === "string" ? parseFloat(val) : val;
    })
    .optional(),

  // Grid Definition fields
  gridColumns: z.number().min(1).max(20).optional(),
  gridRows: z.number().min(1).max(20).optional(),
  mullionWidth: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine(
      (val) => val > 0 && val <= 6,
      "Mullion width must be between 0 and 6 inches"
    )
    .optional(),
  spacingVertical: z.enum(["equal", "custom"]).optional(),
  spacingHorizontal: z.enum(["equal", "custom"]).optional(),

  // Component Names
  componentSill: z.string().optional(),
  componentHead: z.string().optional(),
  componentJambs: z.string().optional(),
  componentVerticals: z.string().optional(),
  componentHorizontals: z.string().optional(),

  // Performance requirements
  thermalPerformance: z.string().optional(),
  windLoadRequirement: z.string().optional(),
  seismicRequirement: z.string().optional(),
  acousticRequirement: z.string().optional(),

  // Quantity and costs
  quantity: z.number().min(1).optional(),
  unitMaterialCost: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val >= 0, "Unit material cost must be non-negative")
    .optional(),
  unitLaborCost: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val >= 0, "Unit labor cost must be non-negative")
    .optional(),
  totalMaterialCost: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val >= 0, "Total material cost must be non-negative")
    .optional(),
  totalLaborCost: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val >= 0, "Total labor cost must be non-negative")
    .optional(),

  // Additional fields
  description: z.string().optional(),
  notes: z.string().optional(),
  sortOrder: z.number().optional(),
});

// GET Route: Fetch specific opening
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
    const opening = await getOpeningById(openingId);

    if (!opening) {
      return NextResponse.json(
        { message: "Opening not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ opening }, { status: 200 });
  } catch (error) {
    console.error("Error fetching opening:", error);
    return NextResponse.json(
      { message: "Error fetching opening" },
      { status: 500 }
    );
  }
}

// PUT Route: Update an opening
export async function PUT(
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
    const parsedData = updateOpeningSchema.parse(body);

    // Validate transom logic if being updated
    if (
      parsedData.hasTransom === true &&
      (!parsedData.transomHeight || parsedData.transomHeight <= 0)
    ) {
      // Check if the opening already has a transom height
      const existingOpening = await getOpeningById(openingId);
      if (
        !existingOpening?.transomHeight ||
        parseFloat(existingOpening.transomHeight) <= 0
      ) {
        return NextResponse.json(
          {
            message:
              "Transom height is required and must be greater than 0 when hasTransom is true",
          },
          { status: 400 }
        );
      }
    }

    // Validate grid dimensions if being updated
    if (parsedData.gridColumns || parsedData.gridRows) {
      const existingOpening = await getOpeningById(openingId);
      if (!existingOpening) {
        return NextResponse.json(
          { message: "Opening not found" },
          { status: 404 }
        );
      }

      const columns = parsedData.gridColumns ?? existingOpening.gridColumns;
      const rows = parsedData.gridRows ?? existingOpening.gridRows;
      const totalPanels = columns * rows;

      if (totalPanels > 100) {
        return NextResponse.json(
          {
            message:
              "Grid configuration would create too many panels (max 100)",
          },
          { status: 400 }
        );
      }
    }

    const updatedOpening = await updateOpening({
      id: openingId,
      ...parsedData,
    });

    return NextResponse.json(
      {
        message: "Opening updated successfully!",
        opening: updatedOpening,
        gridInfo:
          updatedOpening.gridColumns && updatedOpening.gridRows
            ? {
                columns: updatedOpening.gridColumns,
                rows: updatedOpening.gridRows,
                totalPanels:
                  updatedOpening.gridColumns * updatedOpening.gridRows,
                mullionWidth: updatedOpening.mullionWidth,
              }
            : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Validation failed:", error.errors);
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating opening:", error);
    return NextResponse.json(
      { message: "Error updating opening" },
      { status: 500 }
    );
  }
}

// DELETE Route: Delete an opening
export async function DELETE(
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
    // Check if opening exists before attempting to delete
    const existingOpening = await getOpeningById(openingId);
    if (!existingOpening) {
      return NextResponse.json(
        { message: "Opening not found" },
        { status: 404 }
      );
    }

    const success = await deleteOpening(openingId);

    if (!success) {
      return NextResponse.json(
        { message: "Failed to delete opening" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Opening deleted successfully!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting opening:", error);
    return NextResponse.json(
      { message: "Error deleting opening" },
      { status: 500 }
    );
  }
}
