import { NextRequest, NextResponse } from "next/server";
import { getVendorById, updateVendor, deleteVendor } from "../../../db/actions";
import { authenticate, authorize } from "../../../../app/api/admin/helpers";
import { z } from "zod";

// Zod schema for validating vendor data
const vendorSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required"),
  vendorAddress: z.string().optional(),
  vendorCity: z.string().optional(),
  //vendorState: z.string().length(2, "Vendor state must be a 2-letter code"),
  vendorSate: z.string().optional(),
  //vendorZip: z.string().min(5).max(10, "Vendor ZIP code is invalid"),
  vendorPhone: z.string().optional(),
  //vendorEmail: z.string().email().optional(),
  vendorEmail: z.string().optional(),
  vendorContact: z.string().optional(),
  internalVendorId: z.string().optional(),
  taxable: z.boolean(),
});

// Utility function for parsing vendorId
const parseVendorId = (params: { id: string }) => parseInt(params.id, 10);

// GET a single vendor by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const vendorId = parseVendorId(params);
  try {
    const vendor = await getVendorById(vendorId);
    return NextResponse.json({
      message: "Vendor retrieved successfully!",
      vendor,
    });
  } catch (err) {
    console.error("Error fetching vendor:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching vendor" },
      { status: 500 }
    );
  }
}

// PUT to update a vendor
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const vendorId = parseVendorId(params);
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

    // Validate input
    const body = await req.json();
    const result = vendorSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Validation error", errors: result.error.format() },
        { status: 400 }
      );
    }

    // Update vendor
    const updatedVendor = await updateVendor(vendorId, result.data);
    return NextResponse.json({
      message: "Vendor updated successfully!",
      updatedVendor,
    });
  } catch (err) {
    console.error("Unable to update vendor:", err);
    return NextResponse.json(
      { message: "An error occurred while updating vendor" },
      { status: 500 }
    );
  }
}

// DELETE to remove a vendor
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const vendorId = parseVendorId(params);
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

    // Delete vendor
    await deleteVendor(vendorId);
    return NextResponse.json({ message: "Vendor deleted successfully!" });
  } catch (err) {
    console.error("Error deleting vendor:", err);
    return NextResponse.json(
      { message: "An error occurred while deleting vendor" },
      { status: 500 }
    );
  }
}
