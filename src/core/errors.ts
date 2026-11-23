const SECRET_PARAM_PATTERN = /([?&](?:api_key|client_secret|access_token|token)=)([^&\s#]+)/gi;
const BEARER_PATTERN = /(Bearer\s+)[A-Za-z0-9\-._~+/]+=*/gi;
const SECRET_KV_PATTERN =
  /((?:api_key|client_secret|access_token)["']?\s*[:=]\s*["']?)([^"'\s,&}]+)/gi;

/**
 * Redact API keys, OAuth client secrets, and Bearer tokens from arbitrary text.
 */
export function redactSecrets(input: string): string {
  return input
    .replace(SECRET_PARAM_PATTERN, '$1[REDACTED]')
    .replace(BEARER_PATTERN, '$1[REDACTED]')
    .replace(SECRET_KV_PATTERN, '$1[REDACTED]');
}

/**
 * Redact sensitive query parameters (`api_key`, `client_secret`, `access_token`) from a URL.
 */
export function redactUrl(rawUrl: string): string {
  try {
    const isRelative = !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(rawUrl);
    const parsed = isRelative ? new URL(rawUrl, 'https://placeholder.local') : new URL(rawUrl);
    for (const key of ['api_key', 'client_secret', 'access_token', 'token']) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.set(key, 'REDACTED');
      }
    }
    return isRelative ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.toString();
  } catch {
    return redactSecrets(rawUrl);
  }
}

export interface OlaMapsErrorOptions {
  status?: number;
  code?: string;
  requestId?: string;
  correlationId?: string;
  url?: string;
  body?: unknown;
  retryAfter?: number;
  cause?: unknown;
}

export class OlaMapsError extends Error {
  readonly status?: number;
  readonly code: string;
  readonly requestId?: string;
  readonly correlationId?: string;
  readonly url?: string;
  readonly body?: unknown;
  /** Suggested retry delay in milliseconds, if provided by the server. */
  readonly retryAfter?: number;

  constructor(message: string, options: OlaMapsErrorOptions = {}) {
    super(
      redactSecrets(message),
      options.cause !== undefined ? { cause: options.cause } : undefined,
    );
    this.name = 'OlaMapsError';
    this.status = options.status;
    this.code = options.code ?? 'OLA_MAPS_ERROR';
    this.requestId = options.requestId;
    this.correlationId = options.correlationId;
    this.url = options.url ? redactUrl(options.url) : undefined;
    this.body = options.body;
    this.retryAfter = options.retryAfter;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      status: this.status,
      requestId: this.requestId,
      correlationId: this.correlationId,
      url: this.url,
      retryAfter: this.retryAfter,
    };
  }
}

export class OlaAuthError extends OlaMapsError {
  constructor(message: string, options: OlaMapsErrorOptions = {}) {
    super(message, { ...options, code: options.code ?? 'OLA_AUTH_ERROR' });
    this.name = 'OlaAuthError';
  }
}

export class OlaRateLimitError extends OlaMapsError {
  constructor(message: string, options: OlaMapsErrorOptions = {}) {
    super(message, {
      ...options,
      status: options.status ?? 429,
      code: options.code ?? 'OLA_RATE_LIMIT_ERROR',
    });
    this.name = 'OlaRateLimitError';
  }
}

export class OlaValidationError extends OlaMapsError {
  constructor(message: string, options: OlaMapsErrorOptions = {}) {
    super(message, { ...options, code: options.code ?? 'OLA_VALIDATION_ERROR' });
    this.name = 'OlaValidationError';
  }
}

export class OlaTimeoutError extends OlaMapsError {
  readonly timeoutMs?: number;

  constructor(message: string, options: OlaMapsErrorOptions & { timeoutMs?: number } = {}) {
    super(message, { ...options, code: options.code ?? 'OLA_TIMEOUT_ERROR' });
    this.name = 'OlaTimeoutError';
    this.timeoutMs = options.timeoutMs;
  }
}

export class OlaNetworkError extends OlaMapsError {
  constructor(message: string, options: OlaMapsErrorOptions = {}) {
    super(message, { ...options, code: options.code ?? 'OLA_NETWORK_ERROR' });
    this.name = 'OlaNetworkError';
  }
}

/**
 * Parse an HTTP `Retry-After` header (delta-seconds or HTTP-date) into milliseconds.
 */
export function parseRetryAfterMs(headerValue: string | null): number | undefined {
  if (!headerValue) return undefined;
  const trimmed = headerValue.trim();
  const seconds = Number(trimmed);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }
  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }
  return undefined;
}
