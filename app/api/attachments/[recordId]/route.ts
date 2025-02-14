import { NextRequest, NextResponse } from "next/server";
import { getAttachments, deleteAttachment } from "../../../../app/db/actions"; // Assuming these functions are correct
import { authenticate, authorize } from "../../../../app/api/admin/helpers";
import { PERMISSION_LEVELS } from "../../../../app/constants/permissions";
import { z } from "zod";

// Zod schema for validating query parameters
const getAttachmentsSchema = z.object({
  tableName: z.string().min(1, "Table name is required"),
  recordId: z.number().min(1, "Record ID is required").int(), // Ensure it's an integer
});

// GET handler for fetching attachments
export async function GET(
  req: NextRequest,
  { params }: { params: { recordId: string } }
) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()
  try {
    // Extract tableName from query parameters
    const { searchParams } = new URL(req.url);
    const tableName = searchParams.get("tableName") || "";

    // Parse recordId from params
    const recordId = parseInt(params.recordId, 10);
    if (isNaN(recordId)) {
      throw new Error("Invalid recordId provided");
    }

    // Validate the inputs using Zod
    const parsedParams = getAttachmentsSchema.parse({
      tableName,
      recordId,
    });

    // Fetch the attachments using the parsed parameters
    const result = await getAttachments(
      parsedParams.tableName,
      parsedParams.recordId
    );

    // Return success response with attachments
    return NextResponse.json({ success: true, attachments: result });
  } catch (err) {
    console.error("Error in GET /api/attachments:", err);
    return NextResponse.json(
      { error: "An error occurred while fetching attachments" },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting an attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { recordId: string } }
) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()
  try {
    // Extract tableName from query parameters
    const { searchParams } = new URL(req.url);
    const tableName = searchParams.get("tableName") || "";

    // Parse recordId from params
    const recordId = parseInt(params.recordId, 10);
    if (isNaN(recordId)) {
      throw new Error("Invalid recordId provided");
    }

    // Validate the input using Zod
    const parsedParams = getAttachmentsSchema.parse({
      tableName,
      recordId,
    });

    // Delete the attachment using the validated parameters
    await deleteAttachment(parsedParams.recordId);

    // Return success response
    return NextResponse.json({ success: true, message: "Attachment deleted" });
  } catch (err) {
    console.error("Error in DELETE /api/attachments:", err);
    return NextResponse.json(
      { error: "Failed to delete attachment" },
      { status: 500 }
    );
  }
}
