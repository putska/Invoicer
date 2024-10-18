import { NextRequest, NextResponse } from "next/server";
import { uploadAttachment } from "../../../app/db/actions";
import { parse } from "parse-multipart-data";

// Disable automatic body parsing by Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const boundary = contentType.split("boundary=")[1];

    if (!boundary) {
      return NextResponse.json(
        { success: false, message: "Invalid content-type header" },
        { status: 400 }
      );
    }

    // Read the request body as an ArrayBuffer and convert it to a Buffer
    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the multipart form data
    const parts = parse(buffer, boundary);

    // Initialize fields and files
    const fields: Record<string, string> = {};
    let fileData: Buffer | null = null;
    let fileName = "";
    let fileSize = 0;

    // Process each part of the form data
    for (const part of parts) {
      if (part.filename) {
        // It's a file
        fileData = part.data;
        fileName = part.filename;
        fileSize = part.data.length;
      } else {
        // It's a field
        if (part.name) {
          fields[part.name] = part.data.toString("utf8");
        }
      }
    }

    if (!fileData) {
      return NextResponse.json(
        { success: false, message: "No file uploaded" },
        { status: 400 }
      );
    }

    const { recordId, tableName, notes } = fields;

    // Validate required fields
    if (!recordId || !tableName || !fileName || !fileSize) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Upload file to Dropbox and store metadata in the database
    const uploadResult = await uploadAttachment({
      tableName,
      recordId: parseInt(recordId),
      notes: notes || "",
      fileName,
      fileSize,
      fileData,
    });

    return NextResponse.json({ success: true, uploadResult });
  } catch (error) {
    console.error("Error handling file upload:", error);
    return NextResponse.json(
      { success: false, message: "File upload failed" },
      { status: 500 }
    );
  }
}
