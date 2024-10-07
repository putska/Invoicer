// app/api/equipment/route.ts

import { getEquipmentByProjectId } from "../../db/actions";

import { NextRequest, NextResponse } from "next/server";
import {
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  addEquipment,
} from "../../../app/db/actions";
import { Equipment } from "../../../../types";
import { authenticate, authorize } from "../../../app/api/admin/helpers"; // Adjust the import path accordingly

export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
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
  // Authenticate and authorize the user
  //const user = await authenticate();
  //if (!user) return; // Response already sent in authenticate()

  //const isAuthorized = authorize(user, ["admin", "write"]);
  //if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  try {
    const equipmentData: Partial<Equipment> = await req.json();
    console.log("Equipment data:", equipmentData);
    // Validate required fields
    if (!equipmentData.projectId || !equipmentData.equipmentName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Add new equipment
    const newEquipment = await addEquipment(equipmentData);

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
