import type { Metadata } from "next";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = {
  title: "Unsubscribe | PRFC Connect",
};

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-4 text-center">
      <h1 className="font-angkor text-3xl text-prfc-brown sm:text-4xl">Unsubscribe</h1>
      <UnsubscribeForm token={token ?? ""} />
    </div>
  );
}
