import { vi } from "vitest";
import { NextRequest } from "next/server";

interface MockRequestOptions {
  cookies?: Record<string, string>;
  headers?: Record<string, string>;
  body?: unknown;
}

export function createMockRequest(options: MockRequestOptions = {}): NextRequest {
  const { cookies, headers, body } = options;

  return {
    cookies: {
      get: vi.fn((name: string) => {
        const value = cookies?.[name];
        return value ? { name, value } : undefined;
      }),
    },
    headers: {
      get: vi.fn((name: string) => headers?.[name] ?? null),
    },
    json: vi.fn().mockResolvedValue(body ?? {}),
  } as unknown as NextRequest;
}
