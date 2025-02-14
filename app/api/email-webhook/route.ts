import { NextRequest, NextResponse } from "next/server";
import mailgun from "mailgun.js";
import formData from "form-data";
import crypto from "crypto";
import { getPOByNumber, uploadAttachment } from "../../db/actions";
import { validateFile } from "../../components/file-validation"; // Add this import
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly
import { PERMISSION_LEVELS } from "../../../app/constants/permissions";

const mg = new mailgun(formData);
const mgClient = mg.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY!,
});

function verifyMailgunSignature(
  token: string,
  timestamp: string,
  signature: string
): boolean {
  const apiKey = process.env.MAILGUN_SIGNING_KEY!;
  console.log("Using API Key:", apiKey); // Log the API key being used
  const hmac = crypto.createHmac("sha256", apiKey);
  hmac.update(timestamp + token);
  const digest = hmac.digest("hex");
  return digest === signature;
}

export async function POST(request: NextRequest) {
  //Authenticate and authorize the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()
  try {
    const formData = await request.formData();

    // Validate Mailgun signature
    const token = formData.get("token") as string;
    const timestamp = formData.get("timestamp") as string;
    const signature = formData.get("signature") as string;

    // Check if the timestamp is within a reasonable range (e.g., within 5 minutes)
    const currentTime = Date.now();
    const timestampTime = parseInt(timestamp) * 1000;
    const timeDifference = currentTime - timestampTime;

    const isValid = verifyMailgunSignature(token, timestamp, signature);

    if (!isValid) {
      console.error(
        "Invalid signature. Computed HMAC does not match the received signature."
      );
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Extract email data
    const sender = formData.get("sender") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body-plain") as string;

    // Process the email data as needed

    console.log("Mailgun Email Received:");
    console.log("From:", sender);
    console.log("Subject:", subject);

    // Extract the PO number from the subject line (expecting format like "PO-1234")
    const poNumberMatch = subject.match(/PO-(\d+)/i);
    const poNumber = poNumberMatch ? poNumberMatch[1] : null;
    if (!poNumber) {
      console.error("Missing PO number in email subject.");
      return NextResponse.json(
        { error: "Missing PO number in email subject" },
        { status: 400 }
      );
    }
    console.log("PO number extracted:", poNumber);

    // Validate that the PO exists
    const poId = await getPOByNumber(poNumber);
    if (!poId) {
      console.error(`PO ${poNumber} not found.`);
      return NextResponse.json(
        { error: `PO ${poNumber} not found` },
        { status: 404 }
      );
    }

    // Process attachments: Mailgun sends attachments as fields like "attachment-1", "attachment-2", etc.
    const uploadedFiles: string[] = [];
    let errorCount = 0;

    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("attachment")) continue;
      // Each attachment should be a File instance
      if (!(value instanceof File)) continue;
      try {
        const contentType = value.type;
        // Read the file data
        const arrayBuffer = await value.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);

        // Validate the file (throws an error if invalid)
        validateFile(fileBuffer, contentType);

        // Generate a filename. Use the provided name if available.
        const originalFileName = value.name;
        const fileExtension =
          originalFileName && originalFileName.includes(".")
            ? originalFileName.split(".").pop()!
            : contentType.split("/")[1] || "bin";
        const fileName =
          originalFileName || `email-${Date.now()}.${fileExtension}`;

        console.log("Processing attachment:", fileName);
        await uploadAttachment({
          tableName: "purchase_orders",
          recordId: poId,
          notes: `Email attachment for PO ${poNumber}`,
          fileName,
          fileSize: fileBuffer.length,
          fileData: fileBuffer,
        });
        uploadedFiles.push(fileName);
      } catch (error: any) {
        console.error(`Failed to process attachment ${key}:`, error.message);
        errorCount++;
      }
    }

    // Build a status message similar to the SMS endpoint
    let statusMessage = "";
    if (uploadedFiles.length > 0) {
      statusMessage += `✅ Added ${uploadedFiles.length} attachment(s) to PO ${poNumber}. `;
    }
    if (errorCount > 0) {
      statusMessage += `⚠️ Failed to process ${errorCount} attachment(s). `;
    }
    if (uploadedFiles.length === 0 && errorCount === 0) {
      statusMessage = "⚠️ No attachments found in email.";
    }
    console.log("Response message:", statusMessage);

    return NextResponse.json(
      { message: statusMessage.trim() },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing email webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
