// app/api/equipment/route.ts

import { getEquipmentByProjectId } from "../../db/actions";

import { NextRequest, NextResponse } from "next/server";
import {
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  addEquipment,
} from "../../../app/db/actions";
import { Equipment } from "../../types";
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly

export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Extract projectId from query parameters
  const { searchParams } = new URL(req.url);
  const projectId = parseInt(searchParams.get("projectId") || "", 10);

  if (!projectId) {
    return NextResponse.json(
      { message: "Project ID is required" },
      { status: 400 }
    );
  }

  try {
    const equipmentList = await getEquipmentByProjectId(projectId);
    return NextResponse.json({ equipment: equipmentList }, { status: 200 });
  } catch (err) {
    console.error("Error fetching equipment:", err);
    return NextResponse.json(
      { message: "An error occurred while fetching equipment", err },
      { status: 500 }
    );
  }
}

// Handler for POST requests to add new equipment
export async function POST(req: NextRequest) {
  //Authenticate and authorize the user
  const user = await authenticate(req);
  if (!user) return; // Response already sent in authenticate()

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  try {
    const equipmentData: Partial<Equipment> = await req.json();
    // Validate required fields
    if (
      equipmentData.projectId === undefined ||
      typeof equipmentData.projectId !== "number" ||
      !equipmentData.equipmentName
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a complete Equipment object
    const completeEquipmentData: Equipment = {
      projectId: equipmentData.projectId,
      equipmentName: equipmentData.equipmentName,
      // Add default values for other required properties if they are missing
      sortOrder: equipmentData.sortOrder ?? 0,
      costPerDay: equipmentData.costPerDay ?? 0,
      costPerWeek: equipmentData.costPerWeek ?? 0,
      costPerMonth: equipmentData.costPerMonth ?? 0,
      deliveryFee: equipmentData.deliveryFee ?? 0,
      pickupFee: equipmentData.pickupFee ?? 0,
      notes: equipmentData.notes ?? "", // Assuming 0 is a valid default value
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Add other properties as needed
    };

    // Add new equipment
    const newEquipment = await addEquipment(completeEquipmentData);

    return NextResponse.json(
      {
        message: "Equipment added successfully!",
        equipment: newEquipment,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error adding equipment:", err);
    return NextResponse.json(
      {
        message: "An error occurred while adding equipment",
        err,
      },
      { status: 500 }
    );
  }
}
