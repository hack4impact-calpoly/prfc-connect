import { ChevronRight, Plus, Users, UsersRound, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface EntityCardProps {
  variant?: "group" | "add";
  name?: string;
  memberCount?: number;
  description?: string | null;
  onClick?: () => void;
}

export function EntityCard({ variant = "group", name = "", memberCount = 0, onClick }: EntityCardProps) {
  const isAdd = variant === "add";
  const isInteractive = !!onClick;
  const Component = isInteractive ? "button" : "div";

  const content = isAdd ? (
    <div className="flex h-full items-center justify-center">
      <Plus className="h-14 w-14 text-prfc-brown" />
      <Users className="h-32 w-32 text-prfc-brown" />
    </div>
  ) : (
    <div>
      <div className="flex flex-col gap-4 p-4">
        <div className="self-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="p-0 h-6 w-6 rounded-full hover:bg-prfc-border border-transparent bg-transparent drop-shadow-none shadow-none"
              >
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log("Profile clicked")}>Quick Edit</DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("Settings clicked")}>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="font-bold text-xl">{name ? name : "John Doe"}</div>
        <div className="flex gap-2">
          <div className="inline-flex items-center gap-2 bg-transparent text-prfc-border px-4 py-2 rounded-full text-sm">
            <UsersRound className="h-4 w-4" />
            {memberCount} {memberCount === 1 ? "member" : "members"}
          </div>
        </div>
      </div>
      <hr className="bg-zinc-300 h-0.5" />
      <div className="flex flex-col gap-4 p-4">
        {isInteractive ? (
          <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        ) : null}
        Hello
      </div>
    </div>
  );

  return (
    <Component
      {...(isInteractive ? { type: "button" as const, onClick } : {})}
      aria-label={isAdd ? "Add new group" : undefined}
      className={cn(
        "relative w-full rounded-2xl border bg-white text-left shadow-sm p-0 min-h-[160px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isInteractive && "cursor-pointer hover:shadow-md",
      )}
    >
      {content}
    </Component>
  );
}
