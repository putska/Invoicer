"use client";

import { useUser } from "@clerk/nextjs"; // Correct hook for accessing user data
import axios from "axios";
import { useEffect, useState } from "react";
import { PT_Sans } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

const inter = PT_Sans({ weight: ["400", "700"], subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <AuthHandler>
        <html lang="en">
          <body className={inter.className}>
            <nav className="flex justify-between items-center h-[10vh] px-8 border-b-[1p]">
              <Link href="/">
                <Image
                  src="/CSE_LOGO_blue-transparent-web.webp"
                  alt="Company Logo"
                  width={300}
                  height={50}
                  priority
                  style={{ height: "auto" }}
                />
              </Link>
              <div className="flex items-center gap-5">
                {/*-- if user is signed out --*/}
                <SignedOut>
                  <SignInButton mode="modal" />
                </SignedOut>
                {/*-- if user is signed in --*/}
                <SignedIn>
                  <Link href="/summary">Dashboard</Link>
                  <UserButton showName />
                </SignedIn>
              </div>
            </nav>

            {children}
          </body>
        </html>
      </AuthHandler>
    </ClerkProvider>
  );
}

// AuthHandler component to handle user authentication and user creation
function AuthHandler({ children }: { children: React.ReactNode }) {
  const { isLoaded, user } = useUser(); // Using Clerk's useUser to get user information
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoaded && user) {
      const email =
        user.primaryEmailAddress?.emailAddress || "no-email@example.com";
      const firstName = user.firstName || "No";
      const lastName = user.lastName || "Name";

      // Call API to create user
      axios
        .post("/api/createUser", {
          clerk_id: user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          permission_level: "read",
        })
        .then((response) => {
          console.log("User created or already exists:", response.data);
        })
        .catch((err) => {
          console.error("Error creating user:", err);
        });
    }
  }, [isLoaded, user]);

  return <>{children}</>;
}
