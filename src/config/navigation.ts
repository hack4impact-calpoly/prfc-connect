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
    { label: "Home", href: "/" },
    { label: "My Groups", href: "/groups" },
    { label: "Referral", href: "/referral" },
  ],
  admin: [
    { label: "Home", href: "/" },
    { label: "Groups", href: "/groups" },
    { label: "Referral Database", href: "/referral-database" },
    { label: "Broadcast", href: "/broadcast" },
  ],
};
