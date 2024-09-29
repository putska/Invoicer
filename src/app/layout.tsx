// src/app/layout.tsx

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
import { PermissionProvider } from "@/context/PermissionContext";
import { SocketProvider } from "@/context/SocketContext";
import AuthHandler from "@/components/AuthHandler"; // Move AuthHandler to a separate file

const ptSans = PT_Sans({
  subsets: ["latin"], // Specify the font subset
  weight: ["400", "700"], // Add specific weights if needed
});

export const metadata = {
  title: "CSE",
  description: "C/S Erectors Portal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={ptSans.className}>
        <ClerkProvider>
          <SocketProvider>
            <AuthHandler>
              <PermissionProvider>
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
              </PermissionProvider>
            </AuthHandler>
          </SocketProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
