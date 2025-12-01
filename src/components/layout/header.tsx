import Image from "next/image";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "w-full bg-white flex items-center justify-start px-[5vh] py-[5vh]",
        "h-[8vw] shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
        "max-md:h-auto max-md:px-5 max-md:py-[60px] max-md:shadow-none",
        "max-md:bg-[linear-gradient(rgba(255,255,255,0.5),rgba(255,255,255,0.5)),url('/assets/produce.jpg')]",
        "max-md:bg-[length:100%_auto] max-md:bg-no-repeat max-md:bg-center",
        className,
      )}
    >
      <div className="flex items-center max-md:w-full">
        <Image
          src="/assets/logo.png"
          alt="Paso Robles Food Co-op Logo"
          className={cn("h-[4vw] min-h-[60px] w-auto", "max-md:h-auto max-md:max-h-[50px] max-md:w-auto")}
          width={120}
          height={60}
          priority
        />
      </div>
    </header>
  );
}

export default Header;
