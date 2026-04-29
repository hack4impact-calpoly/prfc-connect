import type { LucideIcon } from "lucide-react";

interface ComingSoonPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ComingSoonPage({ icon: Icon, title, description }: ComingSoonPageProps) {
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height)-8rem)] flex-col items-center justify-center text-center">
      <Icon className="mb-4 h-16 w-16 text-muted-foreground" />
      <h1 className="mb-2 font-angkor text-3xl text-prfc-red">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
