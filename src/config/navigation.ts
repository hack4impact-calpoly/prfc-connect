import type { AuthState } from "@/lib/auth-types";

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export const NAV_CONFIG: Record<AuthState, NavItem[]> = {
  unauthenticated: [
    { label: "Home", href: "/" },
    { label: "Sign In", href: "https://pasofoodcooperative.coop/accounts/", external: true },
  ],
  member: [
    { label: "Home", href: "/home" },
    { label: "My Groups", href: "/groups" },
    { label: "Messages", href: "/messages" },
    { label: "Events", href: "/events" },
    { label: "Referral", href: "/referral" },
    { label: "Settings", href: "/settings" },
  ],
  admin: [
    { label: "Home", href: "/home" },
    { label: "Groups", href: "/groups" },
    { label: "Messages", href: "/messages" },
    { label: "Events", href: "/events" },
    { label: "Referral Database", href: "/referral-database" },
    { label: "Broadcast", href: "/broadcast" },
    { label: "Settings", href: "/settings" },
  ],
};
