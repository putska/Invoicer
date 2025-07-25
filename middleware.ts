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

// 👇 Add publicRoutes configuration HERE (second argument)
const publicRoutes = createRouteMatcher([
  "/modules/welcome/page.tsx",
  "/api/tokens",
  "/api/tokens/refresh",
  "/api/glass-takeoff",
  "/modules/privacy/page.tsx",
  "/api/sms-webhook", // Allow public access to SMS webhook
  "/api/email-webhook", // Allow public access to email webhook
  "/",
]);

export default clerkMiddleware(async (auth, req) => {
  if (publicRoutes(req)) {
    return NextResponse.next();
  }

  if (protectedRoutes(req)) {
    auth().protect();

    if (adminRoutes(req)) {
      const clerkUserId = auth().userId;
      if (!clerkUserId) return redirectToUnauthorized(req);

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

  return NextResponse.next();
});

// Helper function remains the same
const redirectToUnauthorized = (req: Request) => {
  const url = new URL(req.url);
  url.pathname = "/modules/welcome/page.tsx";
  return NextResponse.redirect(url);
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
