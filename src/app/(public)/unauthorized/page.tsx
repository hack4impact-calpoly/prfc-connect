import type { Metadata } from "next";
import Link from "next/link";
import { getPortalLoginUrl } from "@/lib/portal";

export const metadata: Metadata = {
  title: "Sign In Required | PRFC Connect",
};

export default function UnauthorizedPage() {
  const portalUrl = getPortalLoginUrl();
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-angkor text-3xl text-prfc-brown sm:text-4xl">Sign in required</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Paso Robles Food Co-op Connect requires authentication. Sign in through the member portal to continue.
      </p>
      <Link
        href={portalUrl}
        className="mt-8 rounded-lg bg-prfc-red px-8 py-3 text-lg font-medium text-white hover:bg-prfc-red/90"
      >
        Sign in with Member Portal
      </Link>
    </div>
  );
}
