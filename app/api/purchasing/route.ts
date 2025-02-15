// /app/api/purchasing/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  getPurchaseOrdersWithDetails,
  addPurchaseOrder,
  getNextPO,
} from "../../db/actions";
import { authenticate, authorize } from "../../../app/api/admin/helpers";
import { z } from "zod";

const purchaseOrderSchema = z.object({
  vendorId: z.number().int().positive(),
  poNumber: z.string().min(1, "PO number is required"),
  jobId: z.number().int().positive(), // Changed from jobNumber to jobId
  projectManager: z.string().min(1, "Project manager is required"),
  poDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid PO date") // Ensure valid date
    .transform((val) => new Date(val)), // Convert to Date object
  dueDate: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || !isNaN(Date.parse(val)), "Invalid due date") // Ensure valid date
    .transform((val) => (val ? new Date(val) : undefined)), // Convert to Date object or undefined
  amount: z.string().optional(), // Total amount
  shipTo: z.string().optional(), // Shipping location
  costCode: z.string().optional(),
  shortDescription: z
    .string()
    .max(50, "Short description must be under 50 characters"),
  longDescription: z.string().optional(),
  notes: z.string().optional(),
  received: z.string().optional(), // Added field for received information
  backorder: z.string().optional(), // Added field for backordered items
  createdAt: z.date().optional(), // Optional, will be set programmatically
  updatedAt: z.date().optional(), // Optional, will be set programmatically
});

// GET all purchase orders
export async function GET() {
  try {
    const purchaseOrders = await getPurchaseOrdersWithDetails();
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

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "read"]);
  if (!isAuthorized) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    // Authenticate the user
    const user = await authenticate(req);
    if (!user) {
      console.error("Authentication Failed");
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Authorize the user
    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      console.error("Authorization Failed for User:", user);
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Parse the request body
    const body = await req.json();
    console.log("Incoming Request Body:", body);

    // Validate the request body using Zod schema
    const result = purchaseOrderSchema.omit({ poNumber: true }).safeParse(body);

    if (!result.success) {
      console.error("Validation Errors:", result.error.format());
      return NextResponse.json(
        {
          message: "Validation error",
          errors: result.error.format(),
        },
        { status: 400 }
      );
    }

    // Step 1: Get the next PO number
    const nextPoNumber = await getNextPO();
    console.log("Next PO Number:", nextPoNumber);

    // Step 2: Add the new purchase order to the database
    const newPurchaseOrder = await addPurchaseOrder({
      ...result.data,
      poNumber: nextPoNumber, // Use the next available PO number
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
      {
        message: "An error occurred while adding purchase order",
        error: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
