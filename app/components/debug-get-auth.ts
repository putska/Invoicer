// components/debug-get-auth.ts
import { getAuth as clerkGetAuth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export function getAuth(request: NextRequest) {
  // Capture the call stack
  const stack = new Error().stack
    ?.split("\n")
    .slice(2)
    .filter((line) => !line.includes("node_modules"))
    .join("\n  ");

  console.log(
    `getAuth() called from:\n  ${stack}\n` +
      `Route: ${request.nextUrl.pathname}\n` +
      `Method: ${request.method}`
  );

  return clerkGetAuth(request);
}
