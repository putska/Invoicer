// app/api/admin/getUsers/route.ts

import { NextResponse } from "next/server";
import { getAllUsers } from "../../../../app/db/actions";
import { cookies } from "next/headers";

export async function GET() {
  cookies();
  // Authenticate the user

  try {
    const users = await getAllUsers();
    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error in getAllUsers API:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
