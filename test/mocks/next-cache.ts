import { vi } from "vitest";

const mockRevalidatePath = vi.fn();

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
}));

beforeEach(() => {
  mockRevalidatePath.mockClear();
});

export { mockRevalidatePath };
