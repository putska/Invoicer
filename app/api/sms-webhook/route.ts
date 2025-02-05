import { NextResponse } from "next/server";
import twilio from "twilio";
import { getPOByNumber, uploadAttachment } from "../../db/actions";
import { validateFile } from "../../components/file-validation"; // Add this import

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3
): Promise<Response> {
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
  try {
    // Get raw request body
    const rawBody = await request.text();

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

    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse message body and media
    const formData = new URLSearchParams(rawBody);
    const bodyText = formData.get("Body") || "";
    const poNumberMatch = bodyText.match(/PO-(\d+)/i);
    const poNumber = poNumberMatch ? poNumberMatch[1] : null;
    console.log("PO number:", poNumber);
    console.log("Media count:", formData.get("NumMedia"));
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
