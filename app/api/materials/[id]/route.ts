import { NextRequest, NextResponse } from "next/server";
import {
  getMaterialById,
  updateMaterial,
  deleteMaterial,
} from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";

// GET a specific material by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const material = await getMaterialById(parseInt(id, 10));
    return material
      ? NextResponse.json(material)
      : NextResponse.json({ message: "Material not found" }, { status: 404 });
  } catch (error) {
    console.error("Error fetching material by ID:", error);
    return NextResponse.json(
      { message: "Failed to retrieve material" },
      { status: 500 }
    );
  }
}

// PUT: Update a specific material
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const updatedData = await req.json();
    await updateMaterial(parseInt(id, 10), updatedData);
    return NextResponse.json({ message: "Material updated successfully" });
  } catch (error) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { message: "Failed to update material" },
      { status: 500 }
    );
  }
}

// DELETE: Delete a specific material
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await deleteMaterial(parseInt(id, 10));
    return NextResponse.json({ message: "Material deleted successfully" });
  } catch (error) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { message: "Failed to delete material" },
      { status: 500 }
    );
  }
}
