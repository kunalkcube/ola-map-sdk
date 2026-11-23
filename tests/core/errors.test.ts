import { describe, expect, it } from 'vitest';
import {
  OlaAuthError,
  OlaMapsError,
  OlaNetworkError,
  OlaRateLimitError,
  OlaTimeoutError,
  OlaValidationError,
  parseRetryAfterMs,
  redactSecrets,
  redactUrl,
} from '../../src/core/errors.js';

describe('errors & secret redaction', () => {
  it('redacts api_key, client_secret, and Bearer tokens from arbitrary strings', () => {
    const raw =
      'Failed GET https://api.olamaps.io/places/v1/autocomplete?input=abc&api_key=super_secret_123 with Authorization: Bearer eyJhbGciOi.payload.sig and client_secret=shhh';
    const cleaned = redactSecrets(raw);

    expect(cleaned).not.toContain('super_secret_123');
    expect(cleaned).not.toContain('eyJhbGciOi.payload.sig');
    expect(cleaned).not.toContain('shhh');
    expect(cleaned).toContain('api_key=[REDACTED]');
    expect(cleaned).toContain('Bearer [REDACTED]');
    expect(cleaned).toContain('client_secret=[REDACTED]');
  });

  it('redacts query params in absolute and relative URLs', () => {
    expect(redactUrl('https://api.olamaps.io/places/v1/geocode?address=blr&api_key=my_key')).toBe(
      'https://api.olamaps.io/places/v1/geocode?address=blr&api_key=REDACTED',
    );
    expect(redactUrl('/api/ola-maps/places/v1/geocode?api_key=secret&q=1')).toBe(
      '/api/ola-maps/places/v1/geocode?api_key=REDACTED&q=1',
    );
  });

  it('redacts secrets in OlaMapsError messages and urls automatically', () => {
    const err = new OlaMapsError('Error calling ?api_key=secret123 Bearer tok_abc', {
      status: 500,
      url: 'https://api.olamaps.io/places/v1/geocode?api_key=secret123',
      requestId: 'req-1',
    });

    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(OlaMapsError);
    expect(err.message).not.toContain('secret123');
    expect(err.message).not.toContain('tok_abc');
    expect(err.url).not.toContain('secret123');
    expect(err.toJSON()).toMatchObject({
      name: 'OlaMapsError',
      status: 500,
      requestId: 'req-1',
    });
  });

  it('preserves instanceof prototype chain for all error subclasses', () => {
    expect(new OlaAuthError('unauth', { status: 401 })).toBeInstanceOf(OlaMapsError);
    expect(new OlaRateLimitError('slow down', { retryAfter: 2000 }).status).toBe(429);
    expect(new OlaValidationError('bad input')).toBeInstanceOf(OlaMapsError);
    expect(new OlaTimeoutError('timed out', { timeoutMs: 5000 }).timeoutMs).toBe(5000);
    expect(new OlaNetworkError('dns fail')).toBeInstanceOf(OlaMapsError);
  });

  it('parses Retry-After seconds and HTTP-date values', () => {
    expect(parseRetryAfterMs('3')).toBe(3000);
    expect(parseRetryAfterMs('0')).toBe(0);
    expect(parseRetryAfterMs(null)).toBeUndefined();
    const futureDate = new Date(Date.now() + 5000).toUTCString();
    const parsed = parseRetryAfterMs(futureDate);
    expect(parsed).toBeDefined();
    expect(parsed!).toBeGreaterThan(0);
    expect(parsed!).toBeLessThanOrEqual(6000);
  });
});
