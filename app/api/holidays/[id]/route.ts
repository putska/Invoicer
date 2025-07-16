import { NextRequest, NextResponse } from "next/server";
import { updateHoliday, deleteHoliday } from "../../../db/actions";
import { authenticate, authorize } from "../../admin/helpers";
import type { UpdateHolidayRequest } from "../../../types";

// PUT: Update a holiday
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const holidayId = parseInt(params.id);
    if (isNaN(holidayId)) {
      return NextResponse.json(
        { message: "Invalid holiday ID" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const updateData: UpdateHolidayRequest = {
      id: holidayId,
      ...body,
    };

    const result = await updateHoliday(updateData);

    if (result.success) {
      return NextResponse.json({
        message: "Holiday updated successfully",
        holiday: result.holiday,
      });
    } else {
      return NextResponse.json(
        { message: result.error || "Failed to update holiday" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating holiday:", error);
    return NextResponse.json(
      { message: "Failed to update holiday" },
      { status: 500 }
    );
  }
}

// DELETE: Remove a holiday
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(req);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized = authorize(user, ["admin", "write"]);
    if (!isAuthorized) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const holidayId = parseInt(params.id);
    if (isNaN(holidayId)) {
      return NextResponse.json(
        { message: "Invalid holiday ID" },
        { status: 400 }
      );
    }

    const result = await deleteHoliday({ id: holidayId });

    if (result.success) {
      return NextResponse.json({
        message: "Holiday deleted successfully",
      });
    } else {
      return NextResponse.json(
        { message: result.error || "Failed to delete holiday" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error deleting holiday:", error);
    return NextResponse.json(
      { message: "Failed to delete holiday" },
      { status: 500 }
    );
  }
}
