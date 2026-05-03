import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  viewAllHref?: string;
  className?: string;
};

export function StatCard({ label, value, icon, viewAllHref, className }: StatCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <div className="flex flex-1 items-center justify-between p-6 pb-4">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-foreground">{label}</p>
          <p className="mt-3 text-4xl font-bold text-foreground">{value}</p>
        </div>
        <div className="ml-4 shrink-0">{icon}</div>
      </div>
      {viewAllHref && (
        <>
          <div className="border-t border-prfc-border/20" />
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 px-6 py-3 text-sm text-muted-foreground hover:text-prfc-brown"
          >
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </>
      )}
    </Card>
  );
}
