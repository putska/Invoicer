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
import { PermissionProvider } from "./context/PermissionContext";
import { SocketProvider } from "./context/SocketContext";
import AuthHandler from "./components/AuthHandler";

// No need for shadcn navigation menu components as we're using custom dropdowns

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata = {
  title: "CSE",
  description: "C/S Erectors Portal",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={ptSans.className}>
        <ClerkProvider
          afterSignOutUrl="/modules/welcome"
          localization={{
            signIn: {
              start: {
                title: "Sign into CSE-Portal",
              },
            },
          }}
        >
          <SocketProvider>
            <AuthHandler>
              <PermissionProvider>
                <nav className="flex justify-between items-center h-[10vh] px-8 border-b">
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
                      {/* Override shadcn's default navigation styles for better control */}
                      <div className="flex items-center space-x-4">
                        {/* Regular link */}
                        <Link
                          href="/modules/summary"
                          className="px-4 py-2 rounded-md hover:bg-gray-100 font-medium"
                        >
                          Dashboard
                        </Link>

                        {/* Projects dropdown */}
                        <div className="relative group">
                          <button className="px-4 py-2 rounded-md hover:bg-gray-100 font-medium">
                            Projects
                          </button>
                          <div className="absolute left-0 top-full mt-1 w-[200px] bg-white rounded-md shadow-lg border p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                            <ul className="grid gap-2">
                              <li>
                                <Link
                                  href="/modules/projects"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  All Projects
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/modules/projects/active"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Active Projects
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/modules/projects/archived"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Archived Projects
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Purchasing dropdown */}
                        <div className="relative group">
                          <button className="px-4 py-2 rounded-md hover:bg-gray-100 font-medium">
                            Purchasing
                          </button>
                          <div className="absolute left-0 top-full mt-1 w-[220px] bg-white rounded-md shadow-lg border p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                            <ul className="grid gap-2">
                              <li>
                                <Link
                                  href="/modules/purchasing"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  All Purchase Orders
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/modules/purchasing/new"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Create New PO
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/modules/purchasing/reports"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Purchasing Reports
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Regular links */}
                        <Link
                          href="/modules/vendors"
                          className="px-4 py-2 rounded-md hover:bg-gray-100 font-medium"
                        >
                          Vendors
                        </Link>

                        <Link
                          href="/modules/materials"
                          className="px-4 py-2 rounded-md hover:bg-gray-100 font-medium"
                        >
                          Shop Materials
                        </Link>

                        {/* Safety dropdown */}
                        <div className="relative group">
                          <button className="px-4 py-2 rounded-md hover:bg-gray-100 font-medium">
                            Safety
                          </button>
                          <div className="absolute left-0 top-full mt-1 w-[200px] bg-white rounded-md shadow-lg border p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                            <ul className="grid gap-2">
                              <li>
                                <Link
                                  href="/modules/safety"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Overview
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/modules/safety/incidents"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Incident Reports
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/modules/safety/training"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Training Materials
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>

                        {/* Engineering dropdown */}
                        <div className="relative group">
                          <button className="px-4 py-2 rounded-md hover:bg-gray-100 font-medium">
                            Engineering
                          </button>
                          <div className="absolute left-0 top-full mt-1 w-[200px] bg-white rounded-md shadow-lg border p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                            <ul className="grid gap-2">
                              <li>
                                <Link
                                  href="/modules/optimize"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Extrusions Opti
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/modules/panel-optimize"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Panels Opti
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/modules/engineering-schedule"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Engineering Schedule
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/modules/engineering/notes"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Engineering Notes
                                </Link>
                              </li>
                              <li>
                                <Link
                                  href="/modules/engineering/training"
                                  className="block p-2 hover:bg-gray-100 rounded-md w-full text-left"
                                >
                                  Training Materials
                                </Link>
                              </li>
                            </ul>
                          </div>
                        </div>

                        <Link
                          href="https://wiki.cse-portal.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-md hover:bg-gray-100 font-medium"
                        >
                          Wiki
                        </Link>
                      </div>

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
