// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getUserByClerkId } from "@/app/db/actions"; // Adjust the path as necessary

// Define protected routes (require authentication)
const protectedRoutes = createRouteMatcher([
  "/activities",
  "/customers",
  "/dashboard",
  "/emails",
  "/history",
  "/invoices(.*)",
  "/labor",
  "/monitor",
  "/projects",
  "/settings",
  "/summary",
]);

// Define admin routes (require authentication and admin permission)
const adminRoutes = createRouteMatcher(["/admin"]);

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
        // Fetch user from the database using clerk_id
        const user = await getUserByClerkId(clerkUserId);

        if (!user || user.permission_level !== "admin") {
          // Redirect to unauthorized if not admin
          const url = req.nextUrl.clone();
          url.pathname = "/unauthorized";
          return NextResponse.redirect(url);
        }

        // User is admin; allow access
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

  // Allow all other requests
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
