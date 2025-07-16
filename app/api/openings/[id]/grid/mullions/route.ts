// app/api/openings/[id]/grid/mullions/route.ts - Mullion operations

import { NextRequest, NextResponse } from "next/server";
import {
  getGridMullionsByOpening,
  updateGridMullion,
  toggleGridMullion,
  moveGridMullion,
} from "../../../../../db/actions";
import { authenticate, authorize } from "../../../../admin/helpers";

// GET /api/openings/[id]/grid/mullions
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const openingId = parseInt(params.id, 10);
  if (isNaN(openingId)) {
    return NextResponse.json(
      { message: "Invalid opening ID" },
      { status: 400 }
    );
  }

  try {
    const mullions = await getGridMullionsByOpening(openingId);
    return NextResponse.json({ mullions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching mullions:", error);
    return NextResponse.json(
      { message: "Error fetching mullions" },
      { status: 500 }
    );
  }
}

// app/api/openings/[id]/grid/mullions/[mullionId]/route.ts - Individual mullion operations

// PUT /api/openings/[id]/grid/mullions/[mullionId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; mullionId: string } }
) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const isAuthorized = authorize(user, ["admin", "write"]);
  if (isAuthorized !== true) {
    return isAuthorized;
  }

  const mullionId = parseInt(params.mullionId, 10);
  if (isNaN(mullionId)) {
    return NextResponse.json(
      { message: "Invalid mullion ID" },
      { status: 400 }
    );
  }

  try {
    const body = await req.json();

    if (body.action === "toggle") {
      const updatedMullion = await toggleGridMullion(mullionId, body.isActive);
      return NextResponse.json(
        {
          message: "Mullion toggled successfully!",
          mullion: updatedMullion,
        },
        { status: 200 }
      );
    }

    if (body.action === "move") {
      const updatedMullion = await moveGridMullion(mullionId, body.newPosition);
      return NextResponse.json(
        {
          message: "Mullion moved successfully!",
          mullion: updatedMullion,
        },
        { status: 200 }
      );
    }

    // Regular update
    const updatedMullion = await updateGridMullion({ id: mullionId, ...body });
    return NextResponse.json(
      {
        message: "Mullion updated successfully!",
        mullion: updatedMullion,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating mullion:", error);
    return NextResponse.json(
      { message: "Error updating mullion" },
      { status: 500 }
    );
  }
}
