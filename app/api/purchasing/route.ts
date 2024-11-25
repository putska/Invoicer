// /app/api/purchasing/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getAllPOs, addPurchaseOrder } from "../../db/actions";
import { authenticate, authorize } from "../../../app/api/admin/helpers";
import { z } from "zod";

// Zod schema for validating purchase order data
const purchaseOrderSchema = z.object({
  vendorId: z.number().int().positive(),
  poNumber: z.string().min(1, "PO number is required"),
  jobNumber: z.string().min(1, "Job number is required"),
  projectManager: z.string().min(1, "Project manager is required"),
  poDate: z.date(),
  dueDate: z.date().optional(),
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
  taxRate: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid tax rate"),
  taxable: z.boolean(),
  warrantyYears: z.number().optional(),
  shortDescription: z
    .string()
    .max(50, "Short description must be under 50 characters"),
  longDescription: z.string().optional(),
  notes: z.string().optional(),
  deliveryDate: z.date().optional(),
});

// GET all purchase orders
export async function GET() {
  try {
    const purchaseOrders = await getAllPOs();
    return NextResponse.json({
      message: "Purchase orders retrieved successfully!",
      purchaseOrders,
    });
  } catch (err) {
    console.error("Error fetching purchase orders:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching purchase orders" },
      { status: 500 }
    );
  }
}

// POST to add a new purchase order
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
    const result = purchaseOrderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { message: "Validation error", errors: result.error.format() },
        { status: 400 }
      );
    }

    // Add the new purchase order to the database
    const newPurchaseOrder = await addPurchaseOrder({
      ...result.data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: "Purchase order added successfully!",
        newPurchaseOrder,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error adding purchase order:", err);
    return NextResponse.json(
      { message: "An error occurred while adding purchase order" },
      { status: 500 }
    );
  }
}
