// Query parameters: id
//app/api/safety/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  getFormSubmission,
  updateFormSubmission,
  deleteFormSubmission,
} from "../../../db/actions";
import { authenticate, authorize } from "@/app/api/admin/helpers";
import { z } from "zod";

const updateFormSchema = z.object({
  formData: z.record(z.any()).optional(),
  jobName: z.string().optional(),
  userName: z.string().optional(),
  submissionDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)))
    .transform((val) => new Date(val))
    .optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const submission = await getFormSubmission(Number(params.id));

    if (!submission) {
      return NextResponse.json(
        { message: "Safety form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Safety form retrieved successfully!",
      submission,
    });
  } catch (err) {
    console.error("Error fetching safety form:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching form" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = updateFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Validation error", errors: result.error.format() },
        { status: 400 }
      );
    }

    const updatedSubmission = await updateFormSubmission(
      Number(params.id),
      result.data
    );

    if (!updatedSubmission) {
      return NextResponse.json(
        { message: "Safety form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Safety form updated successfully!",
      submission: updatedSubmission,
    });
  } catch (err) {
    console.error("Error updating safety form:", err);
    return NextResponse.json(
      {
        message: "An error occurred while updating form",
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const success = await deleteFormSubmission(Number(params.id));

    if (!success) {
      return NextResponse.json(
        { message: "Safety form not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Safety form marked as deleted successfully!",
    });
  } catch (err) {
    console.error("Error deleting safety form:", err);
    return NextResponse.json(
      {
        message: "An error occurred while deleting form",
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
