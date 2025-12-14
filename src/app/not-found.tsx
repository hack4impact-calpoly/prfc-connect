import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-prfc-tan">
      <div className="text-center px-4">
        <h1 className="font-komika text-prfc-red text-6xl mb-2">404</h1>
        <h2 className="font-komika text-prfc-brown text-2xl mb-4">Page not found</h2>
        <p className="font-montserrat text-prfc-dark-brown mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          href="/"
          className="bg-prfc-red text-white px-6 py-3 rounded font-montserrat hover:bg-prfc-brown transition-colors inline-block"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
