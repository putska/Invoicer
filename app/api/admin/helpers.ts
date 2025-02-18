// app/api/admin/helpers.ts

import { NextResponse, NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
//import { getAuth } from "../../components/debug-get-auth"; // Changed import path
import { getUserByClerkId } from "../../../app/db/actions";

/**
 * Checks if the user is authenticated.
 * @returns userId if authenticated, otherwise responds with 401.
 */
export const authenticate = async (request: NextRequest) => {
  const { userId } = getAuth(request);

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserByClerkId(userId);

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return user;
};

/**
 * Checks if the user has the required permissions.
 * @param user - The authenticated user object.
 * @param requiredLevels - Array of required permission levels.
 * @returns true if authorized, otherwise responds with 403.
 */
export const authorize = (user: any, requiredLevels: string[]) => {
  if (!requiredLevels.includes(user.permission_level)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  return true;
};

// Get the user's clerkID then fetch the userId from the database

export const getUserId = async (request: NextRequest) => {
  const { userId: clerkId } = getAuth(request);
  if (!clerkId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const user = await getUserByClerkId(clerkId);

  if (!user) {
    return NextResponse.json({ message: "User not found" }, { status: 404 });
  }

  return user.id;
};
