import type { Metadata } from "next";
import { PT_Sans } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image"; // Import the Image component
import "./globals.css";

const inter = PT_Sans({ weight: ["400", "700"], subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CSE",
  description: "Corporate Portal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <nav className="flex justify-between items-center h-[10vh] px-8 border-b-[1p]">
            <Link href="/">
              <Image
                src="/CSE_LOGO_blue-transparent-web.webp" // Path to the image in the public directory
                alt="Company Logo"
                width={300} // Set the width explicitly
                height={50} // Set the height explicitly, adjust as needed
                priority // Load the image before the page loads
                style={{ height: "auto" }} // Maintain aspect ratio
              />
            </Link>
            <div className="flex items-center gap-5">
              {/*-- if user is signed out --*/}
              <SignedOut>
                <SignInButton mode="modal" />
              </SignedOut>
              {/*-- if user is signed in --*/}
              <SignedIn>
                <Link href="/summary" className="">
                  Dashboard
                </Link>
                <UserButton showName />
              </SignedIn>
            </div>
          </nav>

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
