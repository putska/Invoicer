import { createInvoice, getUserInvoices } from "@/app/db/actions";
import { NextRequest, NextResponse } from "next/server";
import { authenticate, authorize } from "@/app/api/admin/helpers"; // Adjust the import path accordingly
import {
  PERMISSION_LEVELS,
  PermissionLevel,
} from "@/app/constants/permissions";

export async function POST(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  const { customer, title, items, total, ownerID } = await req.json();

  try {
    await createInvoice({
      user_id: ownerID,
      customer_id: customer,
      title,
      total_amount: total,
      items: JSON.stringify(items),
    });
    return NextResponse.json(
      { message: "New Invoice Created!" },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "An error occurred", err },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const userID = req.nextUrl.searchParams.get("userID");

  try {
    const invoices = await getUserInvoices(userID!);
    return NextResponse.json(
      { message: "Invoices retrieved successfully!", invoices },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "An error occurred", err },
      { status: 400 }
    );
  }
}
