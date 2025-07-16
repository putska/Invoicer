// app/api/openings/[id]/grid/mullions/[mullionId]/route.ts - Updated for segmented mullions

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  updateGridMullion,
  toggleGridMullion,
  moveGridMullion,
  deleteGridMullion,
} from "../../../../../../db/actions";
import { authenticate, authorize } from "../../../../../admin/helpers";

// Updated Zod schema for mullion actions with new segmentation fields
const mullionActionSchema = z.object({
  action: z.enum(["toggle", "move", "update"]).optional(),
  isActive: z.boolean().optional(),
  newPosition: z.number().optional(),
  // Regular update fields
  gridType: z
    .enum(["vertical", "horizontal", "sill", "head", "jamb_left", "jamb_right"])
    .optional(),
  gridColumn: z.number().optional(),
  gridRow: z.number().optional(),
  gridSegment: z.number().optional(), // NEW
  componentName: z.string().optional(),
  length: z.union([z.string(), z.number()]).optional(),
  defaultPosition: z.union([z.string(), z.number()]).optional(),
  customPosition: z.number().optional(),
  startX: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    }), // Convert string to number
  endX: z
    .union([z.string(), z.number()])
    .nullable()
    .optional()
    .transform((val) => {
      if (val === null || val === undefined) return null;
      return typeof val === "string" ? parseFloat(val) : val;
    }), // Convert string to number
  notes: z.string().optional(),
});

// PUT /api/openings/[id]/grid/mullions/[mullionId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; mullionId: string } }
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
  const mullionId = parseInt(params.mullionId, 10);

  if (isNaN(openingId) || isNaN(mullionId)) {
    return NextResponse.json(
      { message: "Invalid opening ID or mullion ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    // Add debugging
    console.log("Raw request body:", body);

    // Validate the input data
    const validationResult = mullionActionSchema.safeParse(body);
    if (!validationResult.success) {
      console.log("Validation failed:", validationResult.error.errors);
      return NextResponse.json(
        {
          message: "Validation failed",
          errors: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const validatedData = validationResult.data;
    console.log("Validated data:", validatedData);

    // Handle specific actions
    if (validatedData.action === "toggle") {
      if (typeof validatedData.isActive !== "boolean") {
        return NextResponse.json(
          { message: "isActive is required for toggle action" },
          { status: 400 }
        );
      }

      const updatedMullion = await toggleGridMullion(
        mullionId,
        validatedData.isActive
      );
      return NextResponse.json(
        {
          message: `Mullion ${
            validatedData.isActive ? "activated" : "deactivated"
          } successfully!`,
          mullion: updatedMullion,
        },
        { status: 200 }
      );
    }

    if (validatedData.action === "move") {
      if (typeof validatedData.newPosition !== "number") {
        return NextResponse.json(
          { message: "newPosition is required for move action" },
          { status: 400 }
        );
      }

      const updatedMullion = await moveGridMullion(
        mullionId,
        validatedData.newPosition
      );
      return NextResponse.json(
        {
          message: "Mullion moved successfully!",
          mullion: updatedMullion,
        },
        { status: 200 }
      );
    }

    // Regular update - remove action from data before passing to update function
    const { action, ...updateData } = validatedData;

    // Convert null values to undefined for startX and endX to match UpdateGridMullionInput type
    const sanitizedUpdateData = {
      ...updateData,
      startX: updateData.startX === null ? undefined : updateData.startX,
      endX: updateData.endX === null ? undefined : updateData.endX,
    };

    // Log the data being sent to see if startX/endX are included
    console.log("Updating mullion with data:", sanitizedUpdateData);

    const updatedMullion = await updateGridMullion({
      id: mullionId,
      ...sanitizedUpdateData,
    });

    return NextResponse.json(
      {
        message: "Mullion updated successfully!",
        mullion: updatedMullion,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation failed", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating mullion:", error);
    return NextResponse.json(
      { message: "Error updating mullion" },
      { status: 500 }
    );
  }
}

// DELETE /api/openings/[id]/grid/mullions/[mullionId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; mullionId: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  const mullionId = parseInt(params.mullionId, 10);
  if (isNaN(mullionId)) {
    return NextResponse.json(
      { message: "Invalid mullion ID" },
      { status: 400 }
    );
  }

  try {
    const success = await deleteGridMullion(mullionId);

    if (!success) {
      return NextResponse.json(
        { message: "Failed to delete mullion" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: "Mullion deleted successfully!",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting mullion:", error);
    return NextResponse.json(
      { message: "Error deleting mullion" },
      { status: 500 }
    );
  }
}
