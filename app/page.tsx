import Link from "next/link";
import dotenv from "dotenv";

export default function Home() {
  dotenv.config();
  return (
    <main className="w-full">
      <section className="p-8 h-[90vh] md:w-2/3 mx-auto text-center w-full flex flex-col items-center justify-center">
        <h2 className="text-3xl font-bold mb-4 md:text-4xl">
          C/S Erectors Corporate Portal
        </h2>
        <p className="opacity-70 mb-4 text-sm md:text-base leading-loose">
          Log in to view labor status and monitors
        </p>

        <Link
          href="/modules/summary"
          className="rounded w-[200px] px-2 py-3 bg-blue-500 text-gray-50"
        >
          LOG IN
        </Link>
      </section>
    </main>
  );
}
