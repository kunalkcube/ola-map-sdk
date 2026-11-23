import { vi } from 'vitest';
import type { FetchLike } from '../src/types/common.js';

export interface MockResponseInit {
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

export function createJsonResponse(
  body: unknown,
  init: Omit<MockResponseInit, 'body'> = {},
): Response {
  const status = init.status ?? 200;
  return new Response(JSON.stringify(body), {
    status,
    statusText: init.statusText ?? (status >= 200 && status < 300 ? 'OK' : 'Error'),
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

export function createBinaryResponse(
  bytes: number[] | Uint8Array,
  contentType = 'application/octet-stream',
  status = 200,
): Response {
  const arr = new Uint8Array(bytes);
  return new Response(arr.buffer, {
    status,
    headers: { 'Content-Type': contentType },
  });
}

export function createMockFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const fn = vi.fn<FetchLike>(async (input, init) => {
    const url =
      typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    return handler(url, init);
  });
  return fn;
}
