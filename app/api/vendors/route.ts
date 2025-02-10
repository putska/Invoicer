import { NextRequest, NextResponse } from "next/server";
import { getAllVendors, addVendor } from "../../db/actions";
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly
import { z } from "zod";

// Zod schema for validating vendor data
const vendorSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorAddress: z.string().optional(),
  vendorCity: z.string().optional(),
  //vendorState: z.string().length(2, "Vendor state must be a 2-letter code"),
  vendorState: z.string().optional(),
  //vendorZip: z.string().min(5).max(10, "Vendor ZIP code is invalid"),
  vendorZip: z.string().optional(),
  vendorPhone: z.string().optional(),
  vendorEmail: z.string().email().optional(),
  vendorContact: z.string().optional(),
  internalVendorId: z.string().optional(),
  taxable: z.boolean(),
});

// GET all vendors
export async function GET() {
  try {
    const vendors = await getAllVendors();
    if (vendors.length > 0) {
      return NextResponse.json(
        {
          message: "Vendors retrieved successfully!",
          vendors: vendors,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "No vendors found" },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error("Error fetching vendors:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching vendors" },
      { status: 500 }
    );
  }
}

// POST to add a new vendor
export async function POST(req: NextRequest) {
  try {
    // Authenticate the user
    const user = await authenticate();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Authorize the user
    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Parse and validate request body using Zod schema
    const body = await req.json();
    const result = vendorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Validation error", errors: result.error.format() }, // Improved error formatting
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
        message: "Vendor added successfully!",
        newVendor: newVendor,
      },
      { status: 201 } // 201 Created for a new resource
    );
  } catch (err) {
    console.error("Error adding vendor:", err); // Improved error logging
    return NextResponse.json(
      { message: "An error occurred while adding vendor" },
      { status: 500 }
    );
  }
}
