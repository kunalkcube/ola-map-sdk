export interface LatLng {
  lat: number;
  lng: number;
}

export interface LatLon {
  lat: number;
  lon: number;
}

/**
 * GeoJSON / MapLibre coordinate tuple in `[longitude, latitude]` order.
 */
export type LngLatTuple = readonly [lng: number, lat: number];

/**
 * Flexible coordinate input accepted across all SDK methods.
 * - `{ lat, lng }`
 * - `{ lat, lon }`
 * - `[lng, lat]` (GeoJSON / MapLibre order)
 * - `"lat,lng"` string
 */
export type CoordinateInput = LatLng | LatLon | LngLatTuple | string;

export type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export interface RetryConfig {
  /** Maximum number of retry attempts after the initial request (default: 2). */
  maxRetries?: number;
  /** Initial backoff delay in milliseconds (default: 300). */
  baseDelayMs?: number;
  /** Maximum backoff delay in milliseconds (default: 10_000). */
  maxDelayMs?: number;
  /** HTTP status codes eligible for retry (default: [408, 429, 500, 502, 503, 504]). */
  retryOnStatuses?: readonly number[];
}

export interface CacheConfig {
  /** Time-to-live for cached GET responses in milliseconds (default: 30_000). */
  ttlMs?: number;
  /** Maximum number of cached entries kept in LRU order (default: 200). */
  maxEntries?: number;
}

export interface OAuthTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
  scope?: string;
}

export interface RequestHookContext {
  method: string;
  /** Redacted request URL (credentials stripped). */
  url: string;
  requestId: string;
  correlationId: string;
  attempt: number;
}

export interface ResponseHookContext extends RequestHookContext {
  status: number;
  durationMs: number;
  fromCache: boolean;
}

export interface RequestOptions {
  /** AbortSignal to cancel the in-flight request. */
  signal?: AbortSignal;
  /** Per-request timeout override in milliseconds. */
  timeoutMs?: number;
  /** Custom X-Request-Id header value (auto-generated UUIDv4 if omitted). */
  requestId?: string;
  /** Custom X-Correlation-Id header value (auto-generated UUIDv4 if omitted). */
  correlationId?: string;
  /** Additional headers merged onto this request. */
  headers?: Record<string, string>;
  /** Override retry count for this request, or `false` to disable retries. */
  retries?: number | false;
  /** Bypass in-memory response cache for this request. */
  skipCache?: boolean;
}

export interface OlaMapsClientConfig {
  /** Ola Maps API Key (passed via `api_key` query parameter). */
  apiKey?: string;
  /** OAuth 2.0 Client ID (requires `clientSecret`). */
  clientId?: string;
  /** OAuth 2.0 Client Secret (server-side only; requires `clientId`). */
  clientSecret?: string;
  /** OAuth 2.0 scope (default: `'openid'`). */
  scope?: string;
  /** OAuth 2.0 token endpoint (default: `'https://api.olamaps.io/auth/v1/token'`). */
  tokenUrl?: string;
  /** Refresh OAuth token this many milliseconds before expiry (default: 60_000). */
  tokenRefreshBufferMs?: number;
  /** Pre-issued Bearer access token or async token provider function. */
  accessToken?: string | (() => string | Promise<string>);
  /**
   * API base URL (default: `'https://api.olamaps.io'`).
   * Set to a relative or custom proxy path (e.g. `'/api/ola-maps'`) to enable Proxy Mode
   * without exposing credentials in browser bundles.
   */
  baseUrl?: string;
  /** Custom `fetch` implementation (e.g. Next.js `fetch` with `next: { revalidate }`, mocks, proxies). */
  fetch?: FetchLike;
  /** Default request timeout in milliseconds (default: 15_000). */
  timeoutMs?: number;
  /** Retry configuration, or `false` to disable retries completely. */
  retries?: RetryConfig | false;
  /** Optional in-memory LRU+TTL cache for idempotent GET requests (disabled by default). */
  cache?: CacheConfig | false;
  /** Deduplicate concurrent identical in-flight GET requests (default: true). */
  dedupe?: boolean;
  /** Extra default headers attached to every API request. */
  defaultHeaders?: Record<string, string>;
  /** Lightweight observability hook invoked before each attempt (URL is redacted). */
  onRequest?: (ctx: RequestHookContext) => void;
  /** Lightweight observability hook invoked after each response (URL is redacted). */
  onResponse?: (ctx: ResponseHookContext) => void;
  /** Suppress the development warning when `clientSecret` is used in a browser environment. */
  suppressBrowserWarning?: boolean;
}

export type OlaMapsClientInput = string | OlaMapsClientConfig;
