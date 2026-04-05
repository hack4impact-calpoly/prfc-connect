import { vi } from "vitest";

vi.mock("@/lib/encryption", () => ({
  encrypt: vi.fn((v: string) => v),
  decrypt: vi.fn((v: string) => v),
  blindIndex: vi.fn((v: string) => `hash:${v.toLowerCase()}`),
}));

beforeEach(() => {
  vi.clearAllMocks();
});
