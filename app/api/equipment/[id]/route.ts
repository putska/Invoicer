import { getEquipmentByProjectId } from "../../../db/actions";

import { NextRequest, NextResponse } from "next/server";
import {
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  addEquipment,
} from "../../../../app/db/actions";
import { Equipment } from "../../../types";
import { authenticate, authorize } from "../../../../app/api/admin/helpers"; // Adjust the import path accordingly

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user
  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  const equipmentId = parseInt(params.id, 10);
  try {
    await deleteEquipment(equipmentId);
    return NextResponse.json(
      { message: "Equipment deleted successfully!" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error deleting equipment:", err);
    return NextResponse.json(
      { message: "An error occurred while deleting equipment", err },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) return; // Response already sent in authenticate()

  const equipmentId = parseInt(params.id, 10);

  try {
    const equipmentItem = await getEquipmentById(equipmentId);
    if (equipmentItem) {
      return NextResponse.json(
        {
          message: "Equipment retrieved successfully!",
          equipment: equipmentItem,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Equipment not found" },
        { status: 404 }
      );
    }
  } catch (err) {
    console.error("Error fetching equipment:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching equipment", err },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user
  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  const equipmentId = parseInt(params.id, 10);

  try {
    const updatedEquipment = await req.json();

    // Validate and sanitize input
    const allowedFields: (keyof Equipment)[] = [
      "equipmentName",
      "costPerDay",
      "costPerWeek",
      "costPerMonth",
      "deliveryFee",
      "pickupFee",
      "notes",
      "sortOrder",
    ];

    const updatedData: Partial<Equipment> = {};

    for (const key of allowedFields) {
      if (updatedEquipment[key] !== undefined) {
        updatedData[key] = updatedEquipment[key];
      }
    }

    const result = await updateEquipment(equipmentId, updatedData);
    return NextResponse.json(
      { message: "Equipment updated successfully!", equipment: result },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating equipment:", err);
    return NextResponse.json(
      { message: "An error occurred while updating equipment", err },
      { status: 500 }
    );
  }
}
