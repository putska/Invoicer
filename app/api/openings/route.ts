// app/api/openings/route.ts

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  getOpeningsByElevationId,
  getOpeningsByElevation,
  getOpeningStats,
  createOpening,
  generateGlassPanels,
} from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";

// Enhanced Zod schema for opening creation with grid support
const createOpeningSchema = z.object({
  elevationId: z.number().min(1, "Elevation ID must be a positive number"),
  name: z.string().min(1, "Name is required"),
  openingMark: z.string().optional(),
  startPosition: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val >= 0, "Start position must be non-negative"),
  width: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val > 0, "Width must be greater than 0"),
  height: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val > 0, "Height must be greater than 0"),
  sillHeight: z
    .union([z.number(), z.string()])
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .refine((val) => val >= 0, "Sill height must be non-negative"),
  openingType: z.enum([
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
  ]),
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

// GET Route: Fetch openings for an elevation
export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Validate and parse query parameters
  const { searchParams } = new URL(req.url);
  const elevationIdParam = searchParams.get("elevationId");
  const includeStats = searchParams.get("includeStats") === "true";
  const includeDetails = searchParams.get("includeDetails") === "true";

  if (!elevationIdParam) {
    return NextResponse.json(
      { message: "elevationId parameter is required" },
      { status: 400 }
    );
  }

  const elevationId = parseInt(elevationIdParam, 10);
  if (isNaN(elevationId)) {
    return NextResponse.json(
      { message: "Invalid elevationId parameter" },
      { status: 400 }
    );
  }

  try {
    let openingsList;
    let stats = null;

    if (includeDetails) {
      // Get enhanced openings with computed details
      openingsList = await getOpeningsByElevation(elevationId);
    } else {
      // Get basic openings (your existing function)
      openingsList = await getOpeningsByElevationId(elevationId);
    }

    if (includeStats) {
      stats = await getOpeningStats(elevationId);
    }

    const response: any = { openings: openingsList };
    if (stats) {
      response.stats = stats;
    }

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching openings:", error);
    return NextResponse.json(
      { message: "Error fetching openings" },
      { status: 500 }
    );
  }
}

// POST Route: Create a new opening
export async function POST(req: NextRequest) {
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
    const parsedData = createOpeningSchema.parse(body);

    // Validate transom logic
    if (
      parsedData.hasTransom &&
      (!parsedData.transomHeight || parsedData.transomHeight <= 0)
    ) {
      return NextResponse.json(
        {
          message:
            "Transom height is required and must be greater than 0 when hasTransom is true",
        },
        { status: 400 }
      );
    }

    // Validate grid dimensions make sense
    if (parsedData.gridColumns && parsedData.gridRows) {
      const totalPanels = parsedData.gridColumns * parsedData.gridRows;
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

    const newOpening = await createOpening(parsedData);

    // Auto-generate initial glass panels for the opening
    await generateGlassPanels(newOpening.id);

    return NextResponse.json(
      {
        message: "Opening created successfully!",
        opening: newOpening,
        gridInfo: {
          columns: newOpening.gridColumns,
          rows: newOpening.gridRows,
          totalPanels: newOpening.gridColumns * newOpening.gridRows,
          mullionWidth: newOpening.mullionWidth,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("Validation failed:", error.errors);
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating opening:", error);
    return NextResponse.json(
      { message: "Error creating opening" },
      { status: 500 }
    );
  }
}
