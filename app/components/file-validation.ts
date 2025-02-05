// src/utils/file-validation.ts
export function validateFile(fileBuffer: Buffer, contentType: string) {
  // Get file signature (magic numbers)
  const signature = fileBuffer.subarray(0, 4).toString("hex");

  // Map signatures to MIME types
  const SIGNATURES: { [key: string]: string } = {
    "89504e47": "image/png", // PNG
    ffd8ffe0: "image/jpeg", // JPEG
    "25504446": "application/pdf", // PDF
    "49492a00": "image/tiff", // TIFF
    "4d4d002a": "image/tiff", // TIFF (big-endian)
  };

  // Get actual type from signature
  const actualType = SIGNATURES[signature] || contentType;

  // Check against allowed types
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(",") || [
    "image/jpeg",
    "image/png",
    "application/pdf",
  ];

  if (!allowedTypes.includes(actualType)) {
    throw new Error(`Unsupported file type. Detected: ${actualType}`);
  }

  // Validate file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || "5242880", 10);
  if (fileBuffer.length > maxSize) {
    throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
  }
}
