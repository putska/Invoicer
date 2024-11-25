import { NextRequest, NextResponse } from "next/server";
import { getAllMaterials, addMaterial } from "../../db/actions";
import { authenticate, authorize } from "../admin/helpers";
import { Material } from "../../types";

// GET all materials
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "read"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const materials = await getAllMaterials();
    return NextResponse.json({
      message: "Materials retrieved successfully",
      materials,
    });
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { message: "Failed to retrieve materials" },
      { status: 500 }
    );
  }
}

// POST: Add a new material
export async function POST(req: NextRequest) {
  try {
    const user = await authenticate();
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const material: Omit<Material, "id" | "createdAt" | "updatedAt"> =
      await req.json();
    await addMaterial(material);
    return NextResponse.json(
      { message: "Material added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding material:", error);
    return NextResponse.json(
      { message: "Failed to add material" },
      { status: 500 }
    );
  }
}
