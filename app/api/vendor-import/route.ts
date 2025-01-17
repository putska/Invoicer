import { NextRequest, NextResponse } from "next/server";
import { addVendor } from "../../db/actions"; // Reuse the same database action
import { z } from "zod";

// Simplified schema for importing vendors
const importVendorSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorAddress: z.string().optional().default(" "),
  vendorCity: z.string().optional().default(" "),
  vendorState: z.string().optional().default("CA"), // Default to "CA"
  vendorZip: z.string().optional().default("00000"), // Default to placeholder ZIP
  vendorPhone: z.string().optional(),
  vendorEmail: z.string().optional(),
  vendorContact: z.string().optional(),
  internalVendorId: z.string().optional(),
  taxable: z.boolean().default(true), // Default to true
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = importVendorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Validation error", errors: result.error.format() },
        { status: 400 }
      );
    }

    // Add the new vendor to the database
    const newVendorData = {
      ...result.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const newVendor = await addVendor(newVendorData);

    return NextResponse.json(
      {
        message: "Vendor imported successfully!",
        newVendor,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error importing vendor:", err);
    return NextResponse.json(
      { message: "An error occurred while importing vendor" },
      { status: 500 }
    );
  }
}
