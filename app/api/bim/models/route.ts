// app/api/bim/models/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/app/api/admin/helpers";
import { createBIMModel, getBIMModels } from "@/app/db/actions";

// Schema for validating form data
const createModelSchema = z.object({
  name: z.string().min(1, "Model name is required"),
  description: z.string().optional(),
  projectId: z
    .union([z.string(), z.null()])
    .optional()
    .transform((val) => {
      // Handle cases where projectId is null, "null", empty string, or undefined
      if (!val || val === "null" || val === "undefined" || val === "") {
        return undefined;
      }
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    }),
});

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const models = await getBIMModels();
    return NextResponse.json({ success: true, data: models });
  } catch (error) {
    console.error("Error in GET /api/bim/models:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch models" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log("🔥 ROUTE HANDLER STARTED");
  try {
    console.log("🔥 Starting authentication...");
    // Authenticate the user
    const user = await authenticate(req);
    if (!user || !("id" in user)) {
      console.log("🔥 AUTH FAILED - returning 401");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("🔥 AUTH PASSED - parsing form data...");
    const formData = await req.formData();

    const file = formData.get("file") as File;
    const rawData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      projectId: formData.get("projectId") as string,
    };

    console.log("🔥 FORM DATA:", rawData);
    console.log(
      "🔥 FILE CHECK:",
      file ? `File: ${file.name}, Size: ${file.size} bytes` : "NO FILE RECEIVED"
    );

    console.log("🔥 STARTING VALIDATION...");
    const validationResult = createModelSchema.safeParse(rawData);

    if (!validationResult.success) {
      console.log("🔥 VALIDATION FAILED:");
      console.log(
        "🔥 Validation errors:",
        JSON.stringify(validationResult.error.issues, null, 2)
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input data",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    console.log("🔥 VALIDATION PASSED:", validationResult.data);

    const { name, description, projectId } = validationResult.data;

    console.log("🔥 CHECKING FILE...");
    if (!file) {
      console.log("🔥 NO FILE PROVIDED - returning 400");
      return NextResponse.json(
        { success: false, error: "IFC file is required" },
        { status: 400 }
      );
    }

    console.log("🔥 FILE EXISTS - checking file type...");
    console.log("🔥 File name:", file.name);
    console.log("🔥 File name lowercase:", file.name.toLowerCase());

    const isIFC = file.name.toLowerCase().endsWith(".ifc");
    const isIFCZip = file.name.toLowerCase().endsWith(".ifczip");
    console.log("🔥 Is .ifc file:", isIFC);
    console.log("🔥 Is .ifczip file:", isIFCZip);

    if (!isIFC && !isIFCZip) {
      console.log("🔥 INVALID FILE TYPE - returning 400");
      return NextResponse.json(
        { success: false, error: "Only IFC files are allowed" },
        { status: 400 }
      );
    }

    console.log("🔥 FILE TYPE VALID - calling createBIMModel...");
    const result = await createBIMModel({
      file,
      name,
      description,
      projectId,
    });

    console.log("🔥 createBIMModel RESULT:", result);

    if (!result.success) {
      console.log("🔥 createBIMModel FAILED - returning error");
      return NextResponse.json(result, { status: result.error ? 500 : 400 });
    }

    console.log("🔥 SUCCESS - returning result");
    return NextResponse.json(result);
  } catch (error) {
    console.error("🔥 CAUGHT EXCEPTION:", error);
    console.error(
      "🔥 Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      { success: false, error: "Failed to create model" },
      { status: 500 }
    );
  }
}
