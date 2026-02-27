import { ChevronRight, Plus, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColor, getInitials } from "@/utils/avatar";

interface EntityCardProps {
  variant?: "group" | "add";
  name?: string;
  memberCount?: number;
  description?: string | null;
  onClick?: () => void;
}

const PASO_BROWN = "#523019";

export function EntityCard(props: EntityCardProps) {
  // Default Values:
  const { variant = "group", name = "", memberCount = 0, description = null, onClick } = props;

  const isAdd = variant === "add";

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      className="group w-full cursor-pointer rounded-2xl bg-white shadow-sm hover:shadow-md p-5 min-h-[160px]"
    >
      {isAdd ? (
        <div className="flex items-center justify-center">
          {/* ADD: */}

          {/* Plus Icon */}
          <Plus className="h-14 w-14" style={{ color: PASO_BROWN }} />

          {/* User Icon */}
          <Users className="h-32 w-32" style={{ color: PASO_BROWN }} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* GROUP: */}

          {/* Group Initial Circle Avatar: */}
          <Avatar className="h-14 w-14">
            <AvatarFallback style={{ backgroundColor: getAvatarColor(name) }} className="text-white font-semibold">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>

          {/* Group Name */}
          <div className="font-bold text-5xl">{name}</div>

          {/* Member Count */}
          <div className="flex gap-2">
            <div className="inline-flex items-center gap-2 bg-[#831002] text-white px-4 py-2 rounded-full">
              <Users className="h-5 w-5" />
              {memberCount} {memberCount === 1 ? "member" : "members"}
            </div>
          </div>

          {/* Description */}
          {description ? <p className="text-sm text-muted-foreground line-clamp-2">{description}</p> : null}
          {/* Chevron Right Logo */}
          <div className="absolute right-10">
            <ChevronRight />
          </div>
        </div>
      )}
    </Card>
  );
}
