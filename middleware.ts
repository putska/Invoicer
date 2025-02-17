// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "./app/db/actions";
import { User } from "./app/types";

// Match ALL routes except explicitly public ones
const protectedRoutes = createRouteMatcher([
  "/modules(.*)",
  "/api(.*)", // Add API routes explicitly
]);

const adminRoutes = createRouteMatcher([
  "/modules/admin",
  "/api/admin(.*)", // Protect admin APIs too
]);

export default clerkMiddleware(async (auth, req) => {
  // First check if it's a protected route
  if (protectedRoutes(req)) {
    auth().protect();

    // Then check if it's an admin route
    if (adminRoutes(req)) {
      const clerkUserId = auth().userId;

      if (!clerkUserId) {
        return redirectToUnauthorized(req);
      }

      try {
        const user = await getUserByClerkId(clerkUserId);
        if (!user || user.permission_level !== "admin") {
          return redirectToUnauthorized(req);
        }
      } catch (error) {
        console.error("Permission check failed:", error);
        return redirectToUnauthorized(req);
      }
    }

    return NextResponse.next();
  }

  // Public routes fall through
  return NextResponse.next();
});

// Helper function for redirects
const redirectToUnauthorized = (req: Request) => {
  const url = new URL(req.url);
  url.pathname = "/unauthorized";
  return NextResponse.redirect(url);
};

export const config = {
  // Simplified matcher pattern
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
