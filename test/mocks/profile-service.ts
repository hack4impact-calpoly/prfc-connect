import { vi } from "vitest";

vi.mock("@/services/profile", () => ({
  getMemberProfile: vi.fn(),
}));

import { getMemberProfile } from "@/services/profile";

export const mockGetMemberProfile = vi.mocked(getMemberProfile);
