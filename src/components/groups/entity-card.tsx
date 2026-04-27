import { ChevronRight, Plus, Users, UsersRound, MoreVertical } from "lucide-react";
import { coopFormatTimed } from "@/utils/time";
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
  createdAt?: Date;
  onClick?: () => void;
  onViewGroup?: () => void;
  onQuickEdit?: () => void;
  onDelete?: () => void;
}

export function EntityCard({
  variant = "group",
  name = "",
  memberCount = 0,
  createdAt,
  onClick,
  onViewGroup,
  onQuickEdit,
  onDelete,
}: EntityCardProps) {
  const isAdd = variant === "add";

  const content = isAdd ? (
    <div className="flex h-full items-center justify-center">
      <Plus className="h-14 w-14 text-prfc-brown" />
      <Users className="h-32 w-32 text-prfc-brown" />
    </div>
  ) : (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="font-bold text-xl line-clamp-2">{name}</div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="shrink-0 p-0 h-6 w-6 rounded-full hover:bg-prfc-border border-transparent bg-transparent drop-shadow-none shadow-none"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onQuickEdit?.();
                }}
              >
                Quick Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="mt-2 inline-flex items-center gap-2 text-prfc-border text-md">
          <UsersRound className="h-5 w-5" />
          {memberCount} {memberCount === 1 ? "member" : "members"}
        </div>
        {createdAt && (
          <p className="mt-auto pt-3 text-xs text-muted-foreground">
            Created {coopFormatTimed(createdAt, "MMM d, yyyy")}
          </p>
        )}
      </div>
      <hr className="bg-zinc-300 h-0.5" />
      <div className="flex flex-col gap-4 px-6 py-2">
        <Button
          variant="ghost"
          className="self-start bg-transparent p-0 h-auto text-gray-600 hover:text-gray-800 hover:bg-transparent justify-start gap-1 text-lg text-prfc-border"
          onClick={onViewGroup}
        >
          View Group <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const isClickable = isAdd && !!onClick;
  const Component = isClickable ? "button" : "div";

  return (
    <Component
      {...(isClickable ? { type: "button" as const, onClick } : {})}
      aria-label={isAdd ? "Add new group" : undefined}
      className={cn(
        "relative h-full w-full rounded-2xl border bg-white text-left shadow-sm p-0 min-h-[160px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isClickable && "cursor-pointer hover:shadow-md",
      )}
    >
      {content}
    </Component>
  );
}
