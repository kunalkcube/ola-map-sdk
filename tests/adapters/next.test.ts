import { describe, expect, it } from 'vitest';
import { createOlaMapsProxyHandler } from '../../src/next/index.js';
import { createBinaryResponse, createJsonResponse, createMockFetch } from '../helpers.js';

describe('ola-map-sdk/next proxy handler', () => {
  it('forwards allowlisted requests, strips client api_key, and injects server apiKey', async () => {
    const mockFetch = createMockFetch((url, init) => {
      const parsed = new URL(url);
      expect(parsed.origin).toBe('https://api.olamaps.io');
      expect(parsed.pathname).toBe('/places/v1/autocomplete');
      expect(parsed.searchParams.get('input')).toBe('Bengaluru');
      expect(parsed.searchParams.get('api_key')).toBe('server_secret_key');
      expect(new Headers(init?.headers).get('x-request-id')).toBeTruthy();
      return createJsonResponse({ predictions: [{ place_id: 'p1', description: 'Bengaluru' }] });
    });

    const { GET } = createOlaMapsProxyHandler({
      apiKey: 'server_secret_key',
      fetch: mockFetch,
      cacheControl: 'public, max-age=60',
    });

    const req = new Request(
      'https://myapp.example.com/api/ola-maps/places/v1/autocomplete?input=Bengaluru&api_key=spoofed',
    );
    // Test Next.js 15 async params contract
    const res = await GET(req, {
      params: Promise.resolve({ path: ['places', 'v1', 'autocomplete'] }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('cache-control')).toBe('public, max-age=60');
    expect(await res.json()).toEqual({
      predictions: [{ place_id: 'p1', description: 'Bengaluru' }],
    });
  });

  it('supports server-side OAuth 2.0 credentials and binary tile passthrough', async () => {
    const tileBytes = [0x1a, 0x2b, 0x3c, 0x4d];
    const mockFetch = createMockFetch((url, init) => {
      if (url.includes('/auth/v1/token')) {
        return createJsonResponse({ access_token: 'oauth_tok_1', expires_in: 3600 });
      }
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer oauth_tok_1');
      return createBinaryResponse(tileBytes, 'application/x-protobuf');
    });

    const { GET } = createOlaMapsProxyHandler({
      clientId: 'cid',
      clientSecret: 'csec',
      fetch: mockFetch,
    });

    const req = new Request(
      'https://myapp.example.com/api/ola-maps/tiles/vector/v1/data/planet/14/1/2.pbf',
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('application/x-protobuf');
    expect(Array.from(new Uint8Array(await res.arrayBuffer()))).toEqual(tileBytes);
  });

  it('blocks path traversal, SSRF attempts, and non-allowlisted paths', async () => {
    const mockFetch = createMockFetch(() => createJsonResponse({}));
    const { GET } = createOlaMapsProxyHandler({ apiKey: 'key', fetch: mockFetch });

    // Non-allowlisted upstream path (e.g. /auth/v1/token)
    const r1 = await GET(new Request('https://app.local/api/ola-maps/auth/v1/token'), {
      params: { path: ['auth', 'v1', 'token'] },
    });
    expect(r1.status).toBe(403);

    // Path traversal
    const r2 = await GET(new Request('https://app.local/api/ola-maps/places/v1/..%2F..%2Fadmin'), {
      params: { path: ['places', 'v1', '..%2F..%2Fadmin'] },
    });
    expect(r2.status).toBe(400);

    // @ host-confusion attempt
    const r3 = await GET(new Request('https://app.local/api/ola-maps/places/v1/@evil.com'), {
      params: { path: ['places', 'v1', '@evil.com'] },
    });
    expect(r3.status).toBe(400);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('enforces custom authorize hook and method allowlist', async () => {
    const mockFetch = createMockFetch(() => createJsonResponse({}));
    const { handler } = createOlaMapsProxyHandler({
      apiKey: 'key',
      fetch: mockFetch,
      allowedMethods: ['GET'],
      authorize: (req) => req.headers.get('x-session') === 'valid',
    });

    const denied = await handler(
      new Request('https://app.local/api/ola-maps/places/v1/geocode?address=BLR'),
    );
    expect(denied.status).toBe(403);

    const badMethod = await handler(
      new Request('https://app.local/api/ola-maps/places/v1/geocode', {
        method: 'DELETE',
        headers: { 'x-session': 'valid' },
      }),
    );
    expect(badMethod.status).toBe(405);
  });
});
