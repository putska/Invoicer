import { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { SignInButton } from "@clerk/nextjs"; // Import Clerk components

const WelcomePage: NextPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Image
        src="/CSE_LOGO_blue-transparent-web.webp"
        alt="Company Logo"
        width={300}
        height={50}
        priority
        style={{ height: "auto" }}
      />
      <h1 className="text-4xl mt-8">Welcome</h1>
      <p className="text-lg mt-4">
        Welcome to the C/S Erectors Portal. You will need to log in before you
        can use the portal.
      </p>
      <SignInButton /> {/* Add SignInButton */}
    </div>
  );
};

export default WelcomePage;
