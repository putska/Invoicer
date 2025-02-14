// /app/api/purchasing/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  getPOById,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "../../../db/actions";
import { authenticate, authorize } from "../../../../app/api/admin/helpers";
import { PurchaseOrderUpdate } from "../../../types";
import { z } from "zod";

const purchaseOrderSchema = z.object({
  vendorId: z.number().int().positive(),
  poNumber: z.string().min(1, "PO number is required"),
  jobId: z.number().int().positive(), // Changed from jobNumber to jobId
  projectManager: z.string().min(1, "Project manager is required"),
  // Handle ISO date strings for poDate, dueDate
  poDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid PO date"),
  dueDate: z
    .string()
    .optional()
    .refine((val) => !isNaN(Date.parse(val ?? "")), "Invalid due date"),
  shipTo: z.string().optional(), // Shipping location
  amount: z.string().optional(), // Total amount
  costCode: z.string().optional(),
  shortDescription: z
    .string()
    .max(50, "Short description must be under 50 characters"),
  longDescription: z.string().optional().default(""), // Default to empty string
  notes: z.string().optional().default(""), // Default to empty string
  received: z.string().optional(), // Added field for received info
  backorder: z.string().optional(), // Added field for backorder info
});

// Utility function for parsing purchase order ID
const parsePurchaseOrderId = (params: { id: string }) =>
  parseInt(params.id, 10);

// GET a single purchase order by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "read"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

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
  const user = await authenticate();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "read"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
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
