import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPortalLoginUrl } from "@/lib/portal";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "flex h-16 w-full items-center justify-between border-b border-border bg-paso-grey px-6",
        className,
      )}
    >
      <Image
        src="/assets/logo.png"
        alt="Paso Robles Food Co-op Logo"
        className="h-10 w-auto"
        width={140}
        height={48}
        priority
      />
      <a
        href={getPortalLoginUrl()}
        className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium text-prfc-brown hover:text-prfc-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <ExternalLink className="h-4 w-4" aria-hidden="true" />
        Back to Portal
      </a>
    </header>
  );
}
