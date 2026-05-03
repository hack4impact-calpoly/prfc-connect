"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getInitials } from "@/utils/avatar";

export type InviteeAvatar = {
  id: string;
  name: string;
  photoUrl?: string | null;
};

type Props = {
  invitees: InviteeAvatar[];
  max?: number;
};

export function InviteeAvatarStack({ invitees, max = 6 }: Props) {
  if (invitees.length === 0) return null;

  const visible = invitees.slice(0, max);
  const overflow = invitees.length - visible.length;

  return (
    <div className="flex items-center">
      {visible.map((inv, idx) => (
        <Avatar
          key={inv.id}
          className="h-8 w-8 border-2 border-white"
          style={{ marginLeft: idx === 0 ? 0 : -8, zIndex: visible.length - idx }}
        >
          {inv.photoUrl && <AvatarImage src={inv.photoUrl} alt={inv.name} />}
          <AvatarFallback
            style={{ backgroundColor: getAvatarColor(inv.name), color: "#ffffff" }}
            className="text-xs font-semibold"
          >
            {getInitials(inv.name)}
          </AvatarFallback>
        </Avatar>
      ))}
      {overflow > 0 && (
        <span
          className="ml-[-8px] flex h-8 min-w-8 items-center justify-center rounded-full border-2 border-white bg-paso-light-brown px-2 text-xs font-semibold text-prfc-brown"
          style={{ zIndex: 0 }}
        >
          +{overflow}
        </span>
      )}
    </div>
  );
}
