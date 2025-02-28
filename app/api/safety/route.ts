//app/api/safety/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createFormSubmission, getAllFormSubmissions } from "../../db/actions";
import { authenticate, authorize } from "@/app/api/admin/helpers";
import { z } from "zod";

const formSubmissionSchema = z.object({
  formName: z.string().min(1, "Form name is required"),
  pdfName: z.string().min(1, "PDF template name is required"),
  jobName: z.string().optional(),
  userName: z.string().min(1, "User name is required"),
  formData: z
    .record(z.any())
    .refine(
      (data) => Object.keys(data).length > 0,
      "Form data cannot be empty"
    ),
  submissionDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid submission date")
    .transform((val) => new Date(val)),
});

export async function GET(req: NextRequest) {
  try {
    // Optional authentication for GET
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const includeDeleted = req.nextUrl.searchParams.get("deleted") === "true";
    const submissions = await getAllFormSubmissions(includeDeleted);

    return NextResponse.json({
      message: "Safety forms retrieved successfully!",
      submissions,
    });
  } catch (err) {
    console.error("Error fetching safety forms:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching safety forms" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    console.log("Incoming safety form submission:", body);

    const result = formSubmissionSchema.omit({}).safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Validation error", errors: result.error.format() },
        { status: 400 }
      );
    }

    const newSubmission = await createFormSubmission({
      formName: result.data.formName,
      pdfName: result.data.pdfName,
      jobName: result.data.jobName || "",
      userName: result.data.userName,
      formData: result.data.formData,
      submissionDate: result.data.submissionDate,
      dateCreated: new Date().toISOString(), // Maintain legacy field
    });

    return NextResponse.json(
      {
        message: "Safety form submitted successfully!",
        submission: newSubmission,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error submitting safety form:", err);
    return NextResponse.json(
      {
        message: "An error occurred while submitting form",
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
