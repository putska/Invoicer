// app/not-found.js - Custom 404 error page for App Router
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="error-container">
      <h1>Oops, something went wrong!</h1>
      <p>We can't seem to find the page you're looking for.</p>
      <Link href="/modules/summary" className="home-button">
        Go back home
      </Link>
    </div>
  );
}
