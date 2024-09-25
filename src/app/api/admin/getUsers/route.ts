// app/api/admin/getUsers/route.ts

import { NextResponse } from "next/server";
import { getAllUsers } from "@/app/db/actions";
import { cookies } from "next/headers";

export async function GET() {
  cookies();
  try {
    const users = await getAllUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error in getAllUsers API:", error);
    return NextResponse.json(
      { message: "Error fetching users", error },
      { status: 500 }
    );
  }
}
