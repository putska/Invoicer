// app/api/parts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../admin/helpers"; // Use your custom helper
import { getParts, addPart, deletePart } from "../../../app/db/actions";

export async function GET(req: NextRequest) {
  try {
    // Get user ID from Clerk authentication
    const user = await authenticate(req);

    if (user instanceof NextResponse) {
      return user; // Return the error response
    }

    // Use user.id instead of userId
    const userId = user.id;

    const parts = await getParts(userId);
    return NextResponse.json(parts);
  } catch (error) {
    console.error("Error fetching parts:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error fetching parts",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get user ID from Clerk authentication
    const user = await authenticate(req);

    if (user instanceof NextResponse) {
      return user; // Return the error response
    }

    // Use user.id instead of userId
    const userId = user.id;

    const data = await req.json();

    if (!data.part_no || !data.length) {
      return NextResponse.json(
        { error: "Part number and length are required" },
        { status: 400 }
      );
    }

    const part = await addPart({
      userId,
      partNo: data.part_no,
      length: data.length.toString(),
      markNo: data.mark_no || "",
      finish: data.finish || "",
      fab: data.fab || "",
    });

    return NextResponse.json(part);
  } catch (error) {
    console.error("Error adding part:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error adding part",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get user ID from Clerk authentication
    const user = await authenticate(req);

    if (user instanceof NextResponse) {
      return user; // Return the error response
    }

    // Use user.id instead of userId
    const userId = user.id;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Part ID is required" },
        { status: 400 }
      );
    }

    await deletePart(parseInt(id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting part:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error deleting part",
      },
      { status: 500 }
    );
  }
}
