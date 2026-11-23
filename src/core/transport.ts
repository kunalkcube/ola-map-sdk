import type {
  CacheConfig,
  FetchLike,
  OlaMapsClientConfig,
  RequestOptions,
  RetryConfig,
} from '../types/common.js';
import { type AuthManager, DEFAULT_BASE_URL } from './auth.js';
import {
  OlaAuthError,
  OlaMapsError,
  OlaNetworkError,
  OlaRateLimitError,
  OlaTimeoutError,
  OlaValidationError,
  parseRetryAfterMs,
  redactUrl,
} from './errors.js';

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 300;
const DEFAULT_MAX_DELAY_MS = 10_000;
const DEFAULT_RETRY_STATUSES: readonly number[] = [408, 429, 500, 502, 503, 504];
const DEFAULT_CACHE_TTL_MS = 30_000;
const DEFAULT_CACHE_MAX_ENTRIES = 200;

export type QueryParamValue =
  | string
  | number
  | boolean
  | readonly (string | number | boolean)[]
  | null
  | undefined;

export type QueryParams = Record<string, QueryParamValue>;

export type ResponseFormat = 'json' | 'arrayBuffer' | 'text';

export interface TransportRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  query?: QueryParams;
  body?: unknown;
  headers?: Record<string, string>;
  responseFormat?: ResponseFormat;
  requestOptions?: RequestOptions;
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

/**
 * Zero-dependency RFC 4122 v4 UUID generator using Web Crypto when available.
 */
export function generateUUID(): string {
  const webCrypto = globalThis.crypto;
  if (webCrypto && typeof webCrypto.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
}

function cloneCachedValue<T>(value: T): T {
  if (value instanceof ArrayBuffer) {
    return value.slice(0) as unknown as T;
  }
  return value;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? createAbortError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? createAbortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function createAbortError(): Error {
  const err = new Error('The operation was aborted.');
  err.name = 'AbortError';
  return err;
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (typeof body === 'string' && body.trim().length > 0) {
    return body.trim();
  }
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    const candidate = obj.message ?? obj.error_message ?? obj.error ?? obj.detail;
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return fallback;
}

/**
 * Append query parameters to a URLSearchParams instance, serializing arrays as
 * repeated keys (`marker=a&marker=b`) per Ola Maps API requirements.
 */
export function appendQueryParams(searchParams: URLSearchParams, query?: QueryParams): void {
  if (!query) return;
  for (const [key, rawValue] of Object.entries(query)) {
    if (rawValue === undefined || rawValue === null) continue;
    if (Array.isArray(rawValue)) {
      for (const item of rawValue) {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item));
        }
      }
    } else {
      searchParams.set(key, String(rawValue));
    }
  }
}

export class HttpTransport {
  readonly baseUrl: string;
  private readonly isRelativeBase: boolean;
  private readonly fetchImpl: FetchLike;
  private readonly auth: AuthManager;
  private readonly timeoutMs: number;
  private readonly retryConfig: Required<RetryConfig> | false;
  private readonly cacheConfig: Required<CacheConfig> | false;
  private readonly dedupe: boolean;
  private readonly defaultHeaders: Record<string, string>;
  private readonly onRequest?: OlaMapsClientConfig['onRequest'];
  private readonly onResponse?: OlaMapsClientConfig['onResponse'];

  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();

  constructor(config: OlaMapsClientConfig, auth: AuthManager, fetchImpl: FetchLike) {
    this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this.isRelativeBase = !/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(this.baseUrl);
    this.fetchImpl = fetchImpl;
    this.auth = auth;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.dedupe = config.dedupe ?? true;
    this.defaultHeaders = config.defaultHeaders ? { ...config.defaultHeaders } : {};
    this.onRequest = config.onRequest;
    this.onResponse = config.onResponse;

    if (config.retries === false) {
      this.retryConfig = false;
    } else {
      this.retryConfig = {
        maxRetries: config.retries?.maxRetries ?? DEFAULT_MAX_RETRIES,
        baseDelayMs: config.retries?.baseDelayMs ?? DEFAULT_BASE_DELAY_MS,
        maxDelayMs: config.retries?.maxDelayMs ?? DEFAULT_MAX_DELAY_MS,
        retryOnStatuses: config.retries?.retryOnStatuses ?? DEFAULT_RETRY_STATUSES,
      };
    }

    if (config.cache && typeof config.cache === 'object') {
      this.cacheConfig = {
        ttlMs: config.cache.ttlMs ?? DEFAULT_CACHE_TTL_MS,
        maxEntries: config.cache.maxEntries ?? DEFAULT_CACHE_MAX_ENTRIES,
      };
    } else {
      this.cacheConfig = false;
    }
  }

  clearCache(): void {
    this.cache.clear();
  }

  async request<T>(req: TransportRequest): Promise<T> {
    const responseFormat = req.responseFormat ?? 'json';
    const requestOptions = req.requestOptions ?? {};
    const cacheable = req.method === 'GET' && !requestOptions.skipCache;
    const cacheKey = cacheable
      ? this.buildCacheKey(req.path, req.query, responseFormat)
      : undefined;

    if (cacheKey && this.cacheConfig !== false) {
      const hit = this.getFromCache(cacheKey);
      if (hit !== undefined) {
        const redacted = redactUrl(this.serializeUrl(this.buildUrl(req.path, req.query)));
        this.onResponse?.({
          method: req.method,
          url: redacted,
          requestId: requestOptions.requestId ?? 'cache-hit',
          correlationId: requestOptions.correlationId ?? 'cache-hit',
          attempt: 0,
          status: 200,
          durationMs: 0,
          fromCache: true,
        });
        return cloneCachedValue(hit as T);
      }
    }

    const canDedupe = Boolean(cacheKey && this.dedupe && !requestOptions.signal);
    if (canDedupe && cacheKey) {
      const existing = this.inFlight.get(cacheKey);
      if (existing) {
        const result = (await existing) as T;
        return cloneCachedValue(result);
      }
    }

    const promise = this.executeWithRetries<T>(req, responseFormat, requestOptions).then((data) => {
      if (cacheKey && this.cacheConfig !== false) {
        this.setInCache(cacheKey, data);
      }
      return data;
    });

    if (canDedupe && cacheKey) {
      this.inFlight.set(cacheKey, promise);
    }

    try {
      const result = await promise;
      return canDedupe ? cloneCachedValue(result) : result;
    } finally {
      if (canDedupe && cacheKey) {
        this.inFlight.delete(cacheKey);
      }
    }
  }

  private async executeWithRetries<T>(
    req: TransportRequest,
    responseFormat: ResponseFormat,
    requestOptions: RequestOptions,
  ): Promise<T> {
    const requestId = requestOptions.requestId ?? generateUUID();
    const correlationId = requestOptions.correlationId ?? generateUUID();
    const timeoutMs = requestOptions.timeoutMs ?? this.timeoutMs;

    const maxRetries =
      requestOptions.retries === false || this.retryConfig === false
        ? 0
        : typeof requestOptions.retries === 'number'
          ? requestOptions.retries
          : this.retryConfig.maxRetries;

    const retryStatuses =
      this.retryConfig === false ? DEFAULT_RETRY_STATUSES : this.retryConfig.retryOnStatuses;
    const baseDelayMs =
      this.retryConfig === false ? DEFAULT_BASE_DELAY_MS : this.retryConfig.baseDelayMs;
    const maxDelayMs =
      this.retryConfig === false ? DEFAULT_MAX_DELAY_MS : this.retryConfig.maxDelayMs;

    let oauthRetried = false;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (requestOptions.signal?.aborted) {
        throw requestOptions.signal.reason ?? createAbortError();
      }

      const url = this.buildUrl(req.path, req.query);
      const headers = new Headers({
        Accept: responseFormat === 'json' ? 'application/json' : '*/*',
        ...this.defaultHeaders,
        ...req.headers,
        ...requestOptions.headers,
        'X-Request-Id': requestId,
        'X-Correlation-Id': correlationId,
      });

      await this.auth.applyAuth(url, headers, oauthRetried);

      if (requestOptions.signal?.aborted) {
        throw requestOptions.signal.reason ?? createAbortError();
      }

      let fetchBody: BodyInit | undefined;
      if (req.body !== undefined && req.body !== null) {
        if (typeof FormData !== 'undefined' && req.body instanceof FormData) {
          fetchBody = req.body;
        } else if (
          typeof req.body === 'string' ||
          req.body instanceof Blob ||
          req.body instanceof ArrayBuffer ||
          ArrayBuffer.isView(req.body) ||
          req.body instanceof URLSearchParams
        ) {
          fetchBody = req.body as BodyInit;
        } else {
          if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
          }
          fetchBody = JSON.stringify(req.body);
        }
      }

      const finalUrlString = this.serializeUrl(url);
      const redacted = redactUrl(finalUrlString);
      const startedAt = Date.now();

      this.onRequest?.({
        method: req.method,
        url: redacted,
        requestId,
        correlationId,
        attempt,
      });

      const { signal, cleanup, didTimeout } = this.createAttemptSignal(
        timeoutMs,
        requestOptions.signal,
      );

      let response: Response;
      try {
        response = await this.fetchImpl(finalUrlString, {
          method: req.method,
          headers,
          body: fetchBody,
          signal,
        });
      } catch (error) {
        cleanup();

        if (requestOptions.signal?.aborted) {
          throw requestOptions.signal.reason ?? error;
        }

        if (didTimeout()) {
          const timeoutErr = new OlaTimeoutError(`Request timed out after ${timeoutMs}ms`, {
            url: redacted,
            requestId,
            correlationId,
            timeoutMs,
            cause: error,
          });
          if (attempt < maxRetries) {
            await sleep(
              this.computeBackoff(attempt, baseDelayMs, maxDelayMs),
              requestOptions.signal,
            );
            continue;
          }
          throw timeoutErr;
        }

        if (isAbortError(error)) {
          throw error;
        }

        const networkErr = new OlaNetworkError(
          `Network request failed: ${error instanceof Error ? error.message : String(error)}`,
          {
            url: redacted,
            requestId,
            correlationId,
            cause: error,
          },
        );
        if (attempt < maxRetries) {
          await sleep(this.computeBackoff(attempt, baseDelayMs, maxDelayMs), requestOptions.signal);
          continue;
        }
        throw networkErr;
      }

      cleanup();

      this.onResponse?.({
        method: req.method,
        url: redacted,
        requestId,
        correlationId,
        attempt,
        status: response.status,
        durationMs: Date.now() - startedAt,
        fromCache: false,
      });

      if (response.ok) {
        return this.parseSuccessBody<T>(response, responseFormat);
      }

      // Automatic single-flight OAuth 2.0 token refresh on 401
      if (response.status === 401 && this.auth.mode === 'oauth' && !oauthRetried) {
        oauthRetried = true;
        this.auth.invalidateToken();
        attempt--;
        continue;
      }

      const errorBody = await this.parseErrorBody(response);
      const retryAfterMs = parseRetryAfterMs(response.headers.get('Retry-After'));

      if (attempt < maxRetries && retryStatuses.includes(response.status)) {
        const delayMs =
          retryAfterMs !== undefined
            ? Math.min(retryAfterMs, maxDelayMs)
            : this.computeBackoff(attempt, baseDelayMs, maxDelayMs);
        await sleep(delayMs, requestOptions.signal);
        continue;
      }

      throw this.createHttpError(
        response.status,
        response.statusText,
        errorBody,
        redacted,
        requestId,
        correlationId,
        retryAfterMs,
      );
    }

    throw new OlaMapsError('Request failed after exhausting retries', {
      requestId,
      correlationId,
    });
  }

  private buildUrl(path: string, query?: QueryParams): URL {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const full = `${this.baseUrl}${normalizedPath}`;
    const url = this.isRelativeBase ? new URL(full, 'https://placeholder.local') : new URL(full);
    appendQueryParams(url.searchParams, query);
    return url;
  }

  private serializeUrl(url: URL): string {
    return this.isRelativeBase ? `${url.pathname}${url.search}${url.hash}` : url.toString();
  }

  private buildCacheKey(
    path: string,
    query: QueryParams | undefined,
    format: ResponseFormat,
  ): string {
    const url = this.buildUrl(path, query);
    url.searchParams.sort();
    return `${format}:${url.pathname}?${url.searchParams.toString()}`;
  }

  private getFromCache(key: string): unknown | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    // Refresh LRU order
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  private setInCache(key: string, value: unknown): void {
    if (this.cacheConfig === false) return;
    if (this.cache.size >= this.cacheConfig.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.cacheConfig.ttlMs,
    });
  }

  private createAttemptSignal(
    timeoutMs: number,
    externalSignal?: AbortSignal,
  ): { signal: AbortSignal; cleanup: () => void; didTimeout: () => boolean } {
    const controller = new AbortController();
    let timedOut = false;

    const onExternalAbort = () => {
      controller.abort(externalSignal?.reason ?? createAbortError());
    };

    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason ?? createAbortError());
      } else {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }

    const timer =
      timeoutMs > 0
        ? setTimeout(() => {
            timedOut = true;
            controller.abort(new Error(`Timeout after ${timeoutMs}ms`));
          }, timeoutMs)
        : undefined;

    return {
      signal: controller.signal,
      didTimeout: () => timedOut,
      cleanup: () => {
        if (timer !== undefined) clearTimeout(timer);
        if (externalSignal) {
          externalSignal.removeEventListener('abort', onExternalAbort);
        }
      },
    };
  }

  private computeBackoff(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
    const exponential = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
    // Full jitter in [0.5 * exponential, exponential] for smooth distributed retries
    return Math.round(exponential * (0.5 + Math.random() * 0.5));
  }

  private async parseSuccessBody<T>(response: Response, format: ResponseFormat): Promise<T> {
    if (response.status === 204) {
      return undefined as T;
    }
    if (format === 'arrayBuffer') {
      return (await response.arrayBuffer()) as T;
    }
    if (format === 'text') {
      return (await response.text()) as T;
    }
    const text = await response.text();
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  private async parseErrorBody(response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      if (!text) return undefined;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch {
      return undefined;
    }
  }

  private createHttpError(
    status: number,
    statusText: string,
    body: unknown,
    url: string,
    requestId: string,
    correlationId: string,
    retryAfter?: number,
  ): OlaMapsError {
    const detail = extractErrorMessage(body, statusText || `HTTP ${status}`);
    const message = `Ola Maps API Error (${status}): ${detail}`;
    const opts = { status, url, body, requestId, correlationId, retryAfter };

    if (status === 401 || status === 403) {
      return new OlaAuthError(message, opts);
    }
    if (status === 429) {
      return new OlaRateLimitError(message, opts);
    }
    if (status === 400 || status === 422) {
      return new OlaValidationError(message, opts);
    }
    return new OlaMapsError(message, opts);
  }
}
