import { ChevronRight, Plus, Users } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor, getInitials } from "@/utils/avatar";

interface EntityCardProps {
  variant?: "group" | "add";
  name?: string;
  memberCount?: number;
  description?: string | null;
  onClick?: () => void;
}

export function EntityCard({
  variant = "group",
  name = "",
  memberCount = 0,
  description = null,
  onClick,
}: EntityCardProps) {
  const isAdd = variant === "add";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isAdd ? "Add new group" : undefined}
      className="relative w-full cursor-pointer rounded-2xl border bg-white text-left shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 p-5 min-h-[160px]"
    >
      {isAdd ? (
        <div className="flex h-full items-center justify-center">
          <Plus className="h-14 w-14 text-prfc-brown" />
          <Users className="h-32 w-32 text-prfc-brown" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback style={{ backgroundColor: getAvatarColor(name) }} className="text-white font-semibold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          <div className="font-bold text-xl">{name}</div>

          <div className="flex gap-2">
            <div className="inline-flex items-center gap-2 bg-prfc-red text-white px-4 py-2 rounded-full text-sm">
              <Users className="h-4 w-4" />
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </div>
          </div>

          {description ? <p className="text-sm text-muted-foreground line-clamp-2">{description}</p> : null}

          <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>
      )}
    </button>
  );
}
