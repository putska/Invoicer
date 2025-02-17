// components/debug-get-auth.ts
import { getAuth as clerkGetAuth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

export function getAuth(request: NextRequest) {
  const stack = new Error().stack
    ?.split("\n")
    .slice(2)
    .map((line) =>
      line
        .replace("webpack-internal:///(rsc)/", "") // Clean Next.js internal paths
        .replace(/\(\.next.*?\)/, "")
    )
    .join("\n  ");

  console.log(
    `getAuth() called from:\n  ${stack}\n` +
      `URL: ${request.nextUrl.pathname}\n` +
      `IP: ${request.ip}\n` +
      `Headers: ${JSON.stringify(Object.fromEntries(request.headers))}`
  );

  return clerkGetAuth(request);
}
