import { deleteCustomer, addCustomer, getCustomers } from "@/app/db/actions";
import { NextRequest, NextResponse } from "next/server";
import { authenticate, authorize } from "@/app/api/admin/helpers"; // Adjust the import path accordingly
import { PERMISSION_LEVELS } from "@/app/constants/permissions";

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

  const { userID, customerName, customerEmail, customerAddress } =
    await req.json();

  try {
    await addCustomer({
      user_id: userID,
      name: customerName,
      email: customerEmail,
      address: customerAddress,
    });
    return NextResponse.json(
      { message: "New Customer Created!" },
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
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  const userID = req.nextUrl.searchParams.get("userID");

  try {
    const customers = await getCustomers(userID!);
    return NextResponse.json(
      { message: "Customers retrieved successfully!", customers },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "An error occurred", err },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Authenticate the user
  const user = await authenticate();
  if (!user) return; // Response already sent in authenticate()

  // Authorize the user (e.g., only 'admin' or 'write' can fetch activities)
  const isAuthorized = authorize(user, [
    PERMISSION_LEVELS.ADMIN,
    PERMISSION_LEVELS.WRITE,
  ]);
  if (isAuthorized !== true) return isAuthorized; // Response already sent in authorize()

  const customerID = req.nextUrl.searchParams.get("id");

  try {
    await deleteCustomer(Number(customerID));
    return NextResponse.json({ message: "Customer deleted!" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "An error occurred", err },
      { status: 400 }
    );
  }
}
