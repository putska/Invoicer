import { updateBankInfo, getUserBankInfo } from "@/app/db/actions";
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
  const { accountName, userID, accountNumber, bankName, currency } =
    await req.json();
  try {
    await updateBankInfo({
      user_id: userID,
      bank_name: bankName,
      account_number: Number(accountNumber),
      account_name: accountName,
      currency: currency,
    });
    return NextResponse.json(
      { message: "Bank Details Updated!" },
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
    const bankInfo = await getUserBankInfo(userID!);
    return NextResponse.json(
      { message: "Fetched bank details", bankInfo },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { message: "An error occurred", err },
      { status: 400 }
    );
  }
}
