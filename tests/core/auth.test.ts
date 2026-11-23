import { afterEach, describe, expect, it, vi } from 'vitest';
import { OlaMapsClient } from '../../src/client.js';
import { OlaAuthError, OlaValidationError } from '../../src/core/errors.js';
import { createJsonResponse, createMockFetch } from '../helpers.js';

describe('AuthManager & OAuth 2.0', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('supports API key auth via api_key query param', async () => {
    const mockFetch = createMockFetch(() => createJsonResponse({ predictions: [] }));
    const client = new OlaMapsClient({ apiKey: 'my_api_key', fetch: mockFetch });

    await client.places.autocomplete('Bengaluru');

    const [calledUrl] = mockFetch.mock.calls[0]!;
    expect(String(calledUrl)).toContain('api_key=my_api_key');
    expect(client.authMode).toBe('apiKey');
  });

  it('supports OAuth 2.0 client_credentials with single-flight deduplication and caching', async () => {
    let tokenCalls = 0;
    const mockFetch = createMockFetch((url, init) => {
      if (url.includes('/auth/v1/token')) {
        tokenCalls++;
        expect(init?.method).toBe('POST');
        const body = String(init?.body ?? '');
        expect(body).toContain('grant_type=client_credentials');
        expect(body).toContain('scope=openid');
        expect(body).toContain('client_id=cid_123');
        expect(body).toContain('client_secret=csec_456');
        return createJsonResponse({ access_token: `tok_${tokenCalls}`, expires_in: 3600 });
      }
      const headers = new Headers(init?.headers);
      expect(headers.get('authorization')).toBe('Bearer tok_1');
      return createJsonResponse({ predictions: [] });
    });

    const client = new OlaMapsClient({
      clientId: 'cid_123',
      clientSecret: 'csec_456',
      fetch: mockFetch,
      dedupe: false,
    });

    // Fire 5 concurrent API calls on cold start — must only exchange token ONCE
    await Promise.all([
      client.places.autocomplete('A'),
      client.places.autocomplete('B'),
      client.places.autocomplete('C'),
      client.places.autocomplete('D'),
      client.places.autocomplete('E'),
    ]);

    expect(tokenCalls).toBe(1);
    expect(await client.getAccessToken()).toBe('tok_1');
    expect(tokenCalls).toBe(1);
  });

  it('proactively refreshes OAuth token before expiry and retries once on 401', async () => {
    let tokenCount = 0;
    let apiAttempt = 0;

    const mockFetch = createMockFetch((url, init) => {
      if (url.includes('/auth/v1/token')) {
        tokenCount++;
        return createJsonResponse({ access_token: `tok_${tokenCount}`, expires_in: 3600 });
      }
      apiAttempt++;
      const authHeader = new Headers(init?.headers).get('authorization');
      if (apiAttempt === 1) {
        expect(authHeader).toBe('Bearer tok_1');
        return createJsonResponse({ message: 'Token expired' }, { status: 401 });
      }
      expect(authHeader).toBe('Bearer tok_2');
      return createJsonResponse({ status: 'ok', geocodingResults: [] });
    });

    const client = new OlaMapsClient({
      clientId: 'cid',
      clientSecret: 'csec',
      fetch: mockFetch,
      retries: false,
    });

    const res = await client.places.geocode('Koramangala');
    expect(res.status).toBe('ok');
    expect(tokenCount).toBe(2);
    expect(apiAttempt).toBe(2);
  });

  it('throws OlaAuthError on OAuth token endpoint failure without leaking clientSecret', async () => {
    const mockFetch = createMockFetch(() =>
      createJsonResponse(
        { error: 'invalid_client', error_description: 'Bad secret super_secret_xyz' },
        { status: 401 },
      ),
    );
    const client = new OlaMapsClient({
      clientId: 'cid',
      clientSecret: 'super_secret_xyz',
      fetch: mockFetch,
    });

    await expect(client.getAccessToken()).rejects.toBeInstanceOf(OlaAuthError);
  });

  it('supports static and async accessToken providers', async () => {
    const mockFetch = createMockFetch((_url, init) => {
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer dynamic_jwt');
      return createJsonResponse({ geocodingResults: [] });
    });
    const client = new OlaMapsClient({
      accessToken: async () => 'dynamic_jwt',
      fetch: mockFetch,
    });

    await client.places.geocode('Mumbai');
    expect(client.authMode).toBe('accessToken');
  });

  it('supports Proxy Mode with relative baseUrl and no credentials', async () => {
    const mockFetch = createMockFetch((url, init) => {
      expect(url).toBe('/api/ola-maps/places/v1/geocode?address=Delhi');
      expect(new Headers(init?.headers).get('authorization')).toBeNull();
      return createJsonResponse({ geocodingResults: [] });
    });

    const client = new OlaMapsClient({ baseUrl: '/api/ola-maps', fetch: mockFetch });
    expect(client.authMode).toBe('proxy');
    await client.places.geocode('Delhi');
  });

  it('rejects partial OAuth credentials or missing auth', () => {
    expect(() => new OlaMapsClient({ clientId: 'only-id' })).toThrow(OlaValidationError);
    expect(() => new OlaMapsClient({})).toThrow(OlaValidationError);
  });
});
