import { vi } from "vitest";

vi.mock("@/lib/email-quota", () => ({
  reserveEmailQuota: vi.fn().mockResolvedValue({ allowed: 300, total: 0 }),
}));

import { reserveEmailQuota } from "@/lib/email-quota";

export const mockReserveEmailQuota = vi.mocked(reserveEmailQuota);
