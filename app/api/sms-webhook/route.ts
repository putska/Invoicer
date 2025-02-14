import { NextResponse } from "next/server";
import twilio from "twilio";
import crypto from "crypto"; // For Mailgun signature verification
import { authenticate, authorize } from "../admin/helpers";
import { getPOByNumber, uploadAttachment } from "../../db/actions";
import { validateFile } from "../../components/file-validation"; // Add this import

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "read"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const response = await fetch(url, options);
    if (response.status === 200) return response;
    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    if (retries <= 0) throw error;
    await new Promise((resolve) => setTimeout(resolve, 500));
    return fetchWithRetry(url, options, retries - 1);
  }
}

export async function POST(request: Request) {
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "read"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    // Get raw request body
    const rawBody = await request.text();

    // 2. Check if it's a Mailgun request (look for Mailgun-specific parameters)
    if (request.headers.get("X-Mailgun-Signature")) {
      console.log("Mailgun request detected");
      return handleMailgunRequest(request, rawBody); // Call Mailgun handler
    }

    // Validate Twilio signature
    const signature = request.headers.get("x-twilio-signature") || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN!;
    const url = `${process.env.NGROK_URL}/api/sms-webhook`;

    const parsedBody = Object.fromEntries(
      new URLSearchParams(rawBody).entries()
    );
    const isValid = twilio.validateRequest(
      authToken,
      signature,
      url,
      parsedBody
    );

    // Parse message body and media
    const formData = new URLSearchParams(rawBody);
    const bodyText = formData.get("Body") || "";
    const poNumberMatch = bodyText.match(/PO-(\d+)/i);
    const poNumber = poNumberMatch ? poNumberMatch[1] : null;
    console.log("PO number:", poNumber);
    console.log("Media count:", formData.get("NumMedia"));
    console.log("SMS body:", bodyText);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    // Generate response
    const response = new twilio.twiml.MessagingResponse();

    // Validate PO number
    if (!poNumber) {
      console.error("Missing PO number in message body");
      response.message("❌ Missing PO number in message body");
      return new Response(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    const poId = await getPOByNumber(poNumber);
    if (!poId) {
      console.log(`PO ${poNumber} not found`);
      response.message(`❌ PO ${poNumber} not found`);
      return new Response(response.toString(), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // Process media attachments
    const numMedia = parseInt(formData.get("NumMedia") || "0", 10);
    const uploadedFiles: string[] = [];
    let errorCount = 0;

    // Updated media processing loop
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = formData.get(`MediaUrl${i}`);
      if (!mediaUrl) continue;

      try {
        const authHeader =
          "Basic " +
          Buffer.from(
            `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
          ).toString("base64");

        // Use fetchWithRetry instead of manual retry logic
        const fileResponse = await fetchWithRetry(mediaUrl, {
          headers: { Authorization: authHeader },
        });

        // Verify response before processing
        if (!fileResponse.ok) {
          throw new Error(`HTTP ${fileResponse.status}`);
        }

        // Verify valid content type
        const contentType = fileResponse!.headers.get("content-type");
        if (
          !contentType?.startsWith("image/") &&
          !contentType?.includes("pdf")
        ) {
          throw new Error(`Unexpected content type: ${contentType}`);
        }

        // Clone the response to avoid "body used" errors
        const buffer = await fileResponse!.clone().arrayBuffer();
        const fileBuffer = Buffer.from(buffer);

        // Rest of your processing code...
        validateFile(fileBuffer, contentType);

        // Declare fileName HERE before using it
        const fileExtension = contentType.split("/")[1] || "bin";
        const fileName = `sms-${Date.now()}-${i}.${fileExtension}`;
        console.log("Processing media:", fileName);
        await uploadAttachment({
          tableName: "purchase_orders",
          recordId: poId,
          notes: `SMS attachment for ${poNumber}`,
          fileName, // Use the declared variable
          fileSize: fileBuffer.length,
          fileData: fileBuffer,
        });

        uploadedFiles.push(fileName);
      } catch (error) {
        console.error(`Failed to process media ${i}:`, (error as any).message);
        errorCount++;
      }
    }

    // Build final response message
    let statusMessage = "";
    if (uploadedFiles.length > 0) {
      statusMessage += `✅ Added ${uploadedFiles.length} attachments to ${poNumber}. `;
    }
    if (errorCount > 0) {
      statusMessage += `⚠️ Failed to process ${errorCount} files. `;
    }
    if (numMedia === 0) {
      statusMessage = "⚠️ No attachments found in message";
    }
    console.log("Response message:", statusMessage);
    response.message(statusMessage.trim());

    return new Response(response.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Error processing SMS:", error);
    const errorResponse = new twilio.twiml.MessagingResponse();
    errorResponse.message("⚠️ Internal server error - please contact support");
    return new Response(errorResponse.toString(), {
      headers: { "Content-Type": "text/xml" },
      status: 500,
    });
  }
}

async function handleMailgunRequest(request: Request, rawBody: string) {
  const mailgunSignature = request.headers.get("X-Mailgun-Signature") || "";
  const mailgunTimestamp = request.headers.get("X-Mailgun-Timestamp") || "";
  const isValid = verifyMailgunSignature(
    process.env.MAILGUN_SIGNINGKEY!, // Use your Mailgun signing key
    mailgunTimestamp + rawBody,
    mailgunSignature
  );

  if (!isValid) {
    console.error("Invalid Mailgun signature");
    return NextResponse.json(
      { error: "Invalid Mailgun signature" },
      { status: 401 }
    );
  }

  const formData = new URLSearchParams(rawBody);
  const subject = formData.get("subject");
  const textBody = formData.get("stripped-text");
  const from = formData.get("from");
  // ... extract other Mailgun data (attachments, etc.)

  console.log("Mailgun Email Received:");
  console.log("Subject:", subject);
  console.log("From:", from);
  console.log("Body:", textBody);

  // ... (Your Mailgun processing logic - database updates, Dropbox, etc.)

  return NextResponse.json(
    { message: "Mailgun email processed" },
    { status: 200 }
  ); // Mailgun response
}

function verifyMailgunSignature(
  signingKey: string,
  rawBody: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac("sha256", signingKey);
  hmac.update(rawBody);
  const calculatedSignature = hmac.digest("hex");
  return calculatedSignature === signature;
}
