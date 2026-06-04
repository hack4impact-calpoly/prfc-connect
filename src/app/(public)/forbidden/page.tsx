import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "No Permission | PRFC Outreach",
};

export default function ForbiddenPage() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-angkor text-3xl text-prfc-brown sm:text-4xl">No permission</h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        You don't have access to this page. Contact an admin if you think this is a mistake.
      </p>
      <Link
        href="/home"
        className="mt-8 rounded-lg bg-prfc-red px-8 py-3 text-lg font-medium text-white hover:bg-prfc-red/90"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
