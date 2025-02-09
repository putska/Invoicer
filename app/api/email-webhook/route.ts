import { NextRequest, NextResponse } from "next/server";
import mailgun from "mailgun.js";
import formData from "form-data";
import crypto from "crypto";

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
  console.log("Computed HMAC digest:", digest); // Log the computed HMAC digest
  console.log("Received signature:", signature); // Log the received signature
  return digest === signature;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Validate Mailgun signature
    const token = formData.get("token") as string;
    const timestamp = formData.get("timestamp") as string;
    const signature = formData.get("signature") as string;

    // Log the received values
    console.log("Received token:", token);
    console.log("Received timestamp:", timestamp);
    console.log("Received signature:", signature);

    // Convert and log the timestamp
    const timestampDate = new Date(parseInt(timestamp) * 1000);
    console.log("Converted timestamp:", timestampDate.toISOString());

    // Check if the timestamp is within a reasonable range (e.g., within 5 minutes)
    const currentTime = Date.now();
    const timestampTime = parseInt(timestamp) * 1000;
    const timeDifference = currentTime - timestampTime;
    console.log("Current server time:", new Date(currentTime).toISOString());
    console.log("Time difference (ms):", timeDifference);

    if (timeDifference > 300000 || timeDifference < -300000) {
      // 5 minutes in milliseconds
      console.error("Timestamp is too old or too far in the future.");
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 401 });
    }

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
    console.log("Received email from:", sender);
    console.log("Subject:", subject);
    console.log("Body:", body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}
