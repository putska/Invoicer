import { NextRequest, NextResponse } from "next/server";
import EmailTemplate from "@/app/emails/email";
import { Resend } from "resend";
import { authenticate, authorize } from "@/app/api/admin/helpers"; // Adjust the import path accordingly
import {
  PERMISSION_LEVELS,
  PermissionLevel,
} from "@/app/constants/permissions";
const resend = new Resend(process.env.RESEND_API_KEY!);

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

  const {
    invoiceID,
    items,
    title,
    amount,
    customerEmail,
    issuerName,
    accountNumber,
    currency,
  } = await req.json();

  try {
    const { data, error } = await resend.emails.send({
      from: "Acme <onboarding@resend.dev>",
      to: [customerEmail],
      subject: title,
      react: EmailTemplate({
        invoiceID,
        items: JSON.parse(items),
        amount: Number(amount),
        issuerName,
        accountNumber,
        currency,
      }) as React.ReactElement,
    });

    if (error) {
      return Response.json(
        { message: "Email not sent!", error },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Email delivered!" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Email not sent!", error },
      { status: 500 }
    );
  }
}
