import { vi } from "vitest";
import { PrismaClient } from "@/generated/prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";

vi.mock("@/lib/db", () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

import prisma from "@/lib/db";

beforeEach(() => {
  mockReset(mockPrisma);
});

export const mockPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

export function mockInteractiveTransaction() {
  mockPrisma.$transaction.mockImplementation(((fn: (tx: typeof mockPrisma) => Promise<unknown>) =>
    fn(mockPrisma)) as never);
}
