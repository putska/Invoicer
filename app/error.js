// app/error.js - Error boundary for handling runtime errors
"use client"; // Error components must be Client Components

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="error-container">
      <h1>Oops, something went wrong!</h1>
      <p>We're having trouble on our end.</p>
      <div className="button-container">
        <button onClick={reset} className="retry-button">
          Try again
        </button>
        <Link href="/" className="home-button">
          Go back home
        </Link>
      </div>
    </div>
  );
}
