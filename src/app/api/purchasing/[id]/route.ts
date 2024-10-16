// /app/api/purchasing/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  getPOById,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "../../../db/actions";
import { authenticate, authorize } from "../../../../app/api/admin/helpers";
import { z } from "zod";

export const purchaseOrderSchema = z.object({
  vendorId: z.number().int().positive(),
  poNumber: z.string().min(1, "PO number is required"),
  jobNumber: z.string().min(1, "Job number is required"),
  projectManager: z.string().min(1, "Project manager is required"),
  // Handle ISO date strings for poDate, dueDate, and deliveryDate
  poDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid PO date"),
  dueDate: z
    .string()
    .optional()
    .refine((val) => !isNaN(Date.parse(val ?? "")), "Invalid due date"),
  deliveryDate: z
    .string()
    .optional()
    .refine((val) => !isNaN(Date.parse(val ?? "")), "Invalid delivery date"),
  shipVia: z.string().optional(),
  shipTo: z.string().optional(),
  shipToAddress: z.string().optional(),
  shipToCity: z.string().optional(),
  shipToState: z
    .string()
    .length(2, "Ship to state must be a 2-letter code")
    .optional(),
  shipToZip: z
    .string()
    .min(5)
    .max(10, "Ship to ZIP code is invalid")
    .optional(),
  costCode: z.string().min(1, "Cost code is required"),
  freight: z.number().min(0).default(0),
  boxingCharges: z.number().min(0).default(0),
  poAmount: z.number().positive(),
  taxRate: z.string().min(1, "Tax rate is required"), // Ensure taxRate is a string
  taxable: z.boolean(),
  warrantyYears: z.number().optional(),
  shortDescription: z
    .string()
    .max(50, "Short description must be under 50 characters"),
  longDescription: z.string().optional().default(""), // Default to empty string if not provided
  notes: z.string().optional().default(""), // Default to empty string if null or missing
});

// Utility function for parsing purchase order ID
const parsePurchaseOrderId = (params: { id: string }) =>
  parseInt(params.id, 10);

// GET a single purchase order by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const poId = parsePurchaseOrderId(params);
  try {
    const purchaseOrder = await getPOById(poId);
    return NextResponse.json({
      message: "Purchase order retrieved successfully!",
      purchaseOrder,
    });
  } catch (err) {
    console.error("Error fetching purchase order:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching purchase order" },
      { status: 500 }
    );
  }
}

// PUT to update a purchase order
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const poId = parsePurchaseOrderId(params);
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
    console.log("Received Body: ", body);
    const result = purchaseOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { message: "Validation error", errors: result.error.format() },
        { status: 400 }
      );
    }

    // Update purchase order
    const updatedPurchaseOrder = await updatePurchaseOrder(poId, {
      ...result.data,
      poDate: new Date(result.data.poDate),
      dueDate: result.data.dueDate ? new Date(result.data.dueDate) : undefined,
      deliveryDate: result.data.deliveryDate
        ? new Date(result.data.deliveryDate)
        : undefined,
      taxRate: result.data.taxRate.toString(), // Convert taxRate to string
    });
    return NextResponse.json({
      message: "Purchase order updated successfully!",
      updatedPurchaseOrder,
    });
  } catch (err) {
    console.error("Error updating purchase order:", err);
    return NextResponse.json(
      { message: "An error occurred while updating purchase order" },
      { status: 500 }
    );
  }
}

// DELETE to remove a purchase order
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const poId = parsePurchaseOrderId(params);
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

    // Delete purchase order
    await deletePurchaseOrder(poId);
    return NextResponse.json({
      message: "Purchase order deleted successfully!",
    });
  } catch (err) {
    console.error("Error deleting purchase order:", err);
    return NextResponse.json(
      { message: "An error occurred while deleting purchase order" },
      { status: 500 }
    );
  }
}
