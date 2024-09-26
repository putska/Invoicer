import { NextRequest, NextResponse } from "next/server";
import { getSingleCustomer } from "@/app/db/actions";
import { authenticate, authorize } from "@/app/api/admin/helpers"; // Adjust the import path accordingly
import {
  PERMISSION_LEVELS,
  PermissionLevel,
} from "@/app/constants/permissions";

export async function GET(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  const customerName = req.nextUrl.searchParams.get("name");

  try {
    const customer = await getSingleCustomer(customerName!);
    return NextResponse.json(
      { message: "Customer retrieved successfully!", customer },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "An error occurred", err },
      { status: 400 }
    );
  }
}
