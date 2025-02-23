"use client";

import { NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { SignInButton } from "@clerk/nextjs";

const PrivacyPage: NextPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <header className="mb-8">
        <Image
          src="/CSE_LOGO_blue-transparent-web.webp"
          alt="Company Logo"
          width={300}
          height={50}
          priority
          style={{ height: "auto" }}
        />
      </header>
      <main className="max-w-3xl w-full bg-white p-8 rounded-lg shadow-md">
        <p className="text-lg">
          This Privacy Policy describes how your personal information is
          collected, used, and shared when you visit or make a purchase from our
          website.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">
            Personal Information We Collect
          </h2>
          <p className="mt-4 text-lg">
            When you visit the Site, we automatically collect certain
            information about your device, including details about your web
            browser, IP address, time zone, and cookies. Additionally, as you
            browse the Site, we gather data on the pages or products you view,
            the websites or search terms that referred you here, and your
            interactions on the Site. We refer to this automatically-collected
            data as “Device Information.”
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">
            How Do We Use Your Personal Information?
          </h2>
          <p className="mt-4 text-lg">
            We use the Order Information collected to process orders, including
            payment, shipping, invoicing, and order confirmations. Additionally,
            we:
          </p>
          <ul className="list-disc list-inside mt-4 text-lg">
            <li>Communicate with you;</li>
            <li>Screen orders for potential risk or fraud; and</li>
            <li>
              Provide information or advertising related to our products or
              services in line with your preferences.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">
            Sharing Your Personal Information
          </h2>
          <p className="mt-4 text-lg">
            We share your Personal Information with third parties to help us
            operate our Site. For example:
          </p>
          <ul className="list-disc list-inside mt-4 text-lg">
            <li>
              <Link
                href="https://www.shopify.com/legal/privacy"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Shopify’s Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="https://www.google.com/intl/en/policies/privacy/"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google’s Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="https://tools.google.com/dlpage/gaoptout"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Opt-out of Google Analytics
              </Link>
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Your Rights</h2>
          <p className="mt-4 text-lg">
            If you are a European resident, you have the right to access,
            correct, update, or delete the personal information we hold about
            you. Please contact us using the details below to exercise your
            rights.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Data Retention</h2>
          <p className="mt-4 text-lg">
            We retain your Order Information for our records unless and until
            you ask us to delete it.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Changes</h2>
          <p className="mt-4 text-lg">
            We may update this Privacy Policy occasionally to reflect changes in
            our practices or for legal, operational, or regulatory reasons.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold">Contact Us</h2>
          <p className="mt-4 text-lg">
            For more information about our privacy practices, if you have
            questions, or if you would like to make a complaint, please reach
            out to us at&nbsp;
            <a
              href="mailto:privacy@example.com"
              className="text-blue-600 hover:underline"
            >
              privacy@example.com
            </a>
            .
          </p>
          <p className="mt-4 text-lg">
            <strong>C/S Erectors, Inc.</strong>
            <br />
            2500 Old Crow Canyon Road, Suite 320
            <br />
            San Ramon, CA 94583
          </p>
        </section>

        <div className="mt-8 flex justify-center">
          <SignInButton />
        </div>
      </main>
    </div>
  );
};

export default PrivacyPage;
