import { describe, expect, it, vi } from 'vitest';
import { OlaMapsClient } from '../../src/client.js';
import { OlaRateLimitError, OlaTimeoutError, OlaValidationError } from '../../src/core/errors.js';
import { createJsonResponse, createMockFetch } from '../helpers.js';

describe('HttpTransport', () => {
  it('generates fresh X-Request-Id and X-Correlation-Id per request', async () => {
    const requestIds: string[] = [];
    const correlationIds: string[] = [];

    const mockFetch = createMockFetch((_url, init) => {
      const headers = new Headers(init?.headers);
      requestIds.push(headers.get('x-request-id') ?? '');
      correlationIds.push(headers.get('x-correlation-id') ?? '');
      return createJsonResponse({ predictions: [] });
    });

    const client = new OlaMapsClient({ apiKey: 'key', fetch: mockFetch });
    await client.places.autocomplete('First');
    await client.places.autocomplete('Second');

    expect(requestIds[0]).toBeTruthy();
    expect(requestIds[1]).toBeTruthy();
    expect(requestIds[0]).not.toBe(requestIds[1]);
    expect(correlationIds[0]).not.toBe(correlationIds[1]);
  });

  it('honors caller-supplied requestId and correlationId', async () => {
    const mockFetch = createMockFetch((_url, init) => {
      const headers = new Headers(init?.headers);
      expect(headers.get('x-request-id')).toBe('trace-req-1');
      expect(headers.get('x-correlation-id')).toBe('trace-corr-1');
      return createJsonResponse({ predictions: [] });
    });

    const client = new OlaMapsClient({ apiKey: 'key', fetch: mockFetch });
    await client.places.autocomplete(
      'Query',
      {},
      { requestId: 'trace-req-1', correlationId: 'trace-corr-1' },
    );
  });

  it('retries 429 and 503 with Retry-After and succeeds', async () => {
    let calls = 0;
    const mockFetch = createMockFetch(() => {
      calls++;
      if (calls === 1) {
        return createJsonResponse(
          { message: 'Rate limit exceeded' },
          { status: 429, headers: { 'Retry-After': '0' } },
        );
      }
      if (calls === 2) {
        return createJsonResponse({ message: 'Upstream busy' }, { status: 503 });
      }
      return createJsonResponse({ predictions: [{ place_id: 'p1', description: 'Bengaluru' }] });
    });

    const client = new OlaMapsClient({
      apiKey: 'key',
      fetch: mockFetch,
      retries: { maxRetries: 2, baseDelayMs: 5, maxDelayMs: 20 },
    });

    const res = await client.places.autocomplete('Bengaluru');
    expect(calls).toBe(3);
    expect(res.predictions[0]?.place_id).toBe('p1');
  });

  it('throws OlaRateLimitError with retryAfter after exhausting 429 retries', async () => {
    const mockFetch = createMockFetch(() =>
      createJsonResponse(
        { message: 'Too many requests' },
        { status: 429, headers: { 'Retry-After': '2' } },
      ),
    );

    const client = new OlaMapsClient({
      apiKey: 'key',
      fetch: mockFetch,
      retries: false,
    });

    try {
      await client.places.autocomplete('Bengaluru');
      expect.fail('Expected OlaRateLimitError');
    } catch (err) {
      expect(err).toBeInstanceOf(OlaRateLimitError);
      const rateErr = err as OlaRateLimitError;
      expect(rateErr.status).toBe(429);
      expect(rateErr.retryAfter).toBe(2000);
      expect(rateErr.url).toContain('api_key=REDACTED');
    }
  });

  it('throws OlaTimeoutError when request exceeds timeoutMs', async () => {
    const mockFetch = createMockFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('Aborted');
            err.name = 'AbortError';
            reject(err);
          });
        }),
    );

    const client = new OlaMapsClient({
      apiKey: 'key',
      fetch: mockFetch,
      timeoutMs: 25,
      retries: false,
    });

    await expect(client.places.autocomplete('Slow')).rejects.toBeInstanceOf(OlaTimeoutError);
  });

  it('aborts immediately before fetch and mid-flight without retrying when caller AbortSignal fires', async () => {
    // 1. Pre-flight abort skips network call completely
    const preController = new AbortController();
    const preFetch = createMockFetch(() => createJsonResponse({ predictions: [] }));
    const preClient = new OlaMapsClient({ apiKey: 'key', fetch: preFetch });
    const prePromise = preClient.places.autocomplete(
      'Cancel before fetch',
      {},
      { signal: preController.signal },
    );
    preController.abort();
    await expect(prePromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(preFetch).not.toHaveBeenCalled();

    // 2. Mid-flight abort cancels active fetch and does NOT retry
    const midController = new AbortController();
    const midFetch = createMockFetch(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('User cancelled');
            err.name = 'AbortError';
            reject(err);
          });
          queueMicrotask(() => midController.abort());
        }),
    );

    const midClient = new OlaMapsClient({
      apiKey: 'key',
      fetch: midFetch,
      retries: { maxRetries: 3, baseDelayMs: 5 },
    });

    await expect(
      midClient.places.autocomplete('Cancel mid-flight', {}, { signal: midController.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    expect(midFetch).toHaveBeenCalledTimes(1);
  });

  it('caches GET responses with LRU+TTL and deduplicates concurrent in-flight GETs', async () => {
    let calls = 0;
    const mockFetch = createMockFetch(async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 15));
      return createJsonResponse({ predictions: [{ place_id: `p_${calls}`, description: 'Hit' }] });
    });

    const onResponse = vi.fn();
    const client = new OlaMapsClient({
      apiKey: 'key',
      fetch: mockFetch,
      cache: { ttlMs: 10_000, maxEntries: 10 },
      dedupe: true,
      onResponse,
    });

    // Two concurrent identical calls → deduplicated to 1 fetch
    const [r1, r2] = await Promise.all([
      client.places.autocomplete('Indiranagar'),
      client.places.autocomplete('Indiranagar'),
    ]);
    expect(calls).toBe(1);
    expect(r1.predictions[0]?.place_id).toBe('p_1');
    expect(r2.predictions[0]?.place_id).toBe('p_1');

    // Subsequent call → served from cache
    const r3 = await client.places.autocomplete('Indiranagar');
    expect(calls).toBe(1);
    expect(r3.predictions[0]?.place_id).toBe('p_1');
    expect(onResponse).toHaveBeenLastCalledWith(expect.objectContaining({ fromCache: true }));

    // Clear cache → hits network again
    client.clearCache();
    await client.places.autocomplete('Indiranagar');
    expect(calls).toBe(2);
  });

  it('never logs to console.error on HTTP failures and redacts URLs in hooks', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onRequest = vi.fn();

    const mockFetch = createMockFetch(() =>
      createJsonResponse({ message: 'Invalid query' }, { status: 400 }),
    );

    const client = new OlaMapsClient({
      apiKey: 'super_secret_key',
      fetch: mockFetch,
      retries: false,
      onRequest,
    });

    await expect(client.places.autocomplete('Bad')).rejects.toBeInstanceOf(OlaValidationError);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(onRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        url: expect.not.stringContaining('super_secret_key'),
      }),
    );
    errorSpy.mockRestore();
  });
});
