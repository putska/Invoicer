// app/api/openings/bulk/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bulkUpdateOpenings } from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// Zod schema for individual bulk update item
const bulkUpdateItemSchema = z.object({
  id: z.number().min(1, "Opening ID must be a positive number"),
  data: z.object({
    name: z.string().min(1, "Name is required").optional(),
    openingMark: z.string().optional(),
    startPosition: z
      .number()
      .min(0, "Start position must be non-negative")
      .optional(),
    width: z.number().min(0.1, "Width must be greater than 0").optional(),
    height: z.number().min(0.1, "Height must be greater than 0").optional(),
    sillHeight: z
      .number()
      .min(0, "Sill height must be non-negative")
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
    transomHeight: z.number().min(0.1).optional(),

    // Grid Definition fields
    gridColumns: z.number().min(1).max(20).optional(),
    gridRows: z.number().min(1).max(20).optional(),
    mullionWidth: z.number().min(0.1).max(6).optional(),
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
    unitMaterialCost: z.number().min(0).optional(),
    unitLaborCost: z.number().min(0).optional(),
    totalMaterialCost: z.number().min(0).optional(),
    totalLaborCost: z.number().min(0).optional(),

    // Additional fields
    description: z.string().optional(),
    notes: z.string().optional(),
    sortOrder: z.number().optional(),
  }),
});

// Schema for the entire bulk update request
const bulkUpdateSchema = z
  .array(bulkUpdateItemSchema)
  .min(1, "At least one update is required")
  .max(50, "Maximum 50 updates per request");

// PUT Route: Bulk update openings
export async function PUT(req: NextRequest) {
  // Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  try {
    const body = await req.json();
    const parsedData = bulkUpdateSchema.parse(body);

    // Validate each update item for business logic
    for (const update of parsedData) {
      // Validate transom logic
      if (update.data.hasTransom === true && !update.data.transomHeight) {
        return NextResponse.json(
          {
            message: `Transom height is required when hasTransom is true for opening ID ${update.id}`,
          },
          { status: 400 }
        );
      }

      // Validate grid dimensions
      if (update.data.gridColumns && update.data.gridRows) {
        const totalPanels = update.data.gridColumns * update.data.gridRows;
        if (totalPanels > 100) {
          return NextResponse.json(
            {
              message: `Grid configuration would create too many panels (max 100) for opening ID ${update.id}`,
            },
            { status: 400 }
          );
        }
      }
    }

    const updatedOpenings = await bulkUpdateOpenings(parsedData);

    // Calculate some summary statistics
    const totalUpdated = updatedOpenings.length;
    const gridUpdates = updatedOpenings.filter(
      (opening) => opening.gridColumns && opening.gridRows
    ).length;

    return NextResponse.json(
      {
        message: `Successfully updated ${totalUpdated} opening${
          totalUpdated !== 1 ? "s" : ""
        }!`,
        openings: updatedOpenings,
        summary: {
          totalUpdated,
          gridUpdatesApplied: gridUpdates,
          updateIds: updatedOpenings.map((o) => o.id),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Bulk update validation failed:", error.errors);
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error bulk updating openings:", error);
    return NextResponse.json(
      { message: "Error bulk updating openings" },
      { status: 500 }
    );
  }
}
