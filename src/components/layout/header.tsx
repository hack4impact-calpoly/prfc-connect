import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header className={cn("flex h-16 w-full items-center border-b border-border bg-paso-grey px-6", className)}>
      <Image
        src="/assets/logo.png"
        alt="Paso Robles Food Co-op Logo"
        className="h-10 w-auto"
        width={140}
        height={48}
        priority
      />
    </header>
  );
}

export default Header;
