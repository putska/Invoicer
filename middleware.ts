// src/middleware.ts

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUserByClerkId } from "./app/db/actions"; // Import the action function
import { User } from "./app/types"; // Ensure correct path

// Define protected routes that require authentication
const protectedRoutes = createRouteMatcher(["/modules(.*)"]);

// Define admin routes that require authentication and admin permission
const adminRoutes = createRouteMatcher(["/modules/admin"]);

export default clerkMiddleware(async (auth, req) => {
  // Handle general protected routes
  if (protectedRoutes(req)) {
    auth().protect();
  }

  // Handle admin-specific routes
  if (adminRoutes(req)) {
    auth().protect(); // Ensure the user is authenticated

    const clerkUserId = auth().userId; // Get Clerk's user ID

    if (clerkUserId) {
      try {
        // Fetch user by clerk_id using the action function
        const user: User | null = await getUserByClerkId(clerkUserId);

        if (!user || user.permission_level !== "admin") {
          // If user is not found or not an admin, redirect to unauthorized
          const url = req.nextUrl.clone();
          url.pathname = "/unauthorized";
          return NextResponse.redirect(url);
        }

        // If user is an admin, allow access
        return NextResponse.next();
      } catch (error) {
        console.error("Error checking user permissions:", error);
        // On error, redirect to unauthorized
        const url = req.nextUrl.clone();
        url.pathname = "/unauthorized";
        return NextResponse.redirect(url);
      }
    } else {
      // If no Clerk user ID is found, redirect to unauthorized
      const url = req.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  // Allow all other requests to proceed
  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
