// a well designed web page that the user will get redirected to when they do not have authorization to see a page
// src/pages/unauthorized.tsx
import { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { ClerkProvider, SignInButton } from "@clerk/nextjs"; // 👈 Import Clerk components

const UnauthorizedPage: NextPage = () => {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl={
        process.env.NEXT_PUBLIC_BASE_URL + "/modules/summary"
      } // 👈 Redirect to summary page after sign in
      signUpFallbackRedirectUrl={
        process.env.NEXT_PUBLIC_BASE_URL + "/modules/summary"
      } // 👈 Redirect to summary page after sign up
      afterSignOutUrl={
        process.env.NEXT_PUBLIC_BASE_URL + "/modules/unauthorized"
      } // 👈 Redirect to unauthorized page after sign out
    >
      <div className="flex flex-col items-center justify-center h-screen">
        <Image
          src="/CSE_LOGO_blue-transparent-web.webp"
          alt="Company Logo"
          width={300}
          height={50}
          priority
          style={{ height: "auto" }}
        />
        <h1 className="text-4xl mt-8">Unauthorized</h1>
        <p className="text-lg mt-4">
          You do not have permission to view this page.
        </p>
        <Link href="/">
          <a className="text-blue-600 underline mt-4">Return to Home</a>
        </Link>
        <SignInButton /> {/* 👈 Add SignInButton */}
      </div>
    </ClerkProvider>
  );
};
