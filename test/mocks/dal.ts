import { vi } from "vitest";

const mockVerifySession = vi.fn();
const mockRequireAdmin = vi.fn();

vi.mock("@/lib/dal", () => ({
  verifySession: mockVerifySession,
  requireAdmin: mockRequireAdmin,
}));

beforeEach(() => {
  mockVerifySession.mockReset();
  mockRequireAdmin.mockReset();
});

export { mockVerifySession, mockRequireAdmin };
