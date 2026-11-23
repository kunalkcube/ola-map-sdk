import { DEFAULT_BASE_URL } from '../core/auth.js';
import type { LngLatTuple } from '../types/common.js';

export const OLA_MAP_STYLES = [
  'default-light-lite',
  'default-light-standard',
  'default-ultra-light-standard',
  'default-light-full',
  'default-dark-lite',
  'default-dark-standard',
  'default-dark-full',
  'default-dark-standard-satellite',
  'eclipse-light-lite',
  'eclipse-light-standard',
  'eclipse-light-full',
  'eclipse-dark-lite',
  'eclipse-dark-standard',
  'eclipse-dark-full',
  'bolt-light',
  'bolt-dark',
  'vintage-light',
  'vintage-dark',
  'default-earth-lite',
  'default-earth-standard',
  'default-earth-full',
  'positron',
  'osm-bright',
  'osm-basic',
  'dark-matter',
  'fiord-color',
  'silver-osm',
] as const;

export type OlaMapStyleName = (typeof OLA_MAP_STYLES)[number] | (string & {});

export interface MapLibreRequestParameters {
  url: string;
  headers?: Record<string, string>;
  credentials?: 'same-origin' | 'include';
  collectResourceTiming?: boolean;
}

export type MapLibreTransformRequest = (
  url: string,
  resourceType?: string,
) => MapLibreRequestParameters;

export interface MapLibreTransformOptions {
  /** Ola Maps API key (attached strictly to `*.olamaps.io` URLs). */
  apiKey?: string;
  /** Bearer access token (attached strictly to `*.olamaps.io` URLs via Authorization header). */
  accessToken?: string;
  /**
   * Optional proxy base URL (e.g. `'/api/ola-maps'` or `'https://app.example.com/api/ola-maps'`).
   * When set, `*.olamaps.io` tile/style/font requests are rewritten to route through your proxy
   * without attaching credentials in the browser.
   */
  proxyBaseUrl?: string;
}

export interface MapLibreMapOptionsInput extends Record<string, unknown> {
  container?: string | HTMLElement;
  center?: LngLatTuple;
  zoom?: number;
  style?: OlaMapStyleName | Record<string, unknown>;
  /** Override base URL for style resolution (defaults to `proxyBaseUrl` or `https://api.olamaps.io`). */
  baseUrl?: string;
}

export interface MapLibreMapOptions extends Record<string, unknown> {
  container?: string | HTMLElement;
  style: string | Record<string, unknown>;
  center: LngLatTuple;
  zoom: number;
  transformRequest: MapLibreTransformRequest;
}

/**
 * Check whether a hostname belongs strictly to Ola Maps (`olamaps.io` or `*.olamaps.io`).
 */
export function isOlaMapsHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return normalized === 'olamaps.io' || normalized.endsWith('.olamaps.io');
}

/**
 * Build the full MapLibre style JSON URL for a named Ola Maps style.
 */
export function getStyleURL(
  styleName: OlaMapStyleName = 'default-light-standard',
  baseUrl: string = DEFAULT_BASE_URL,
): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  return `${trimmedBase}/tiles/vector/v1/styles/${encodeURIComponent(styleName)}/style.json`;
}

/**
 * Create a host-safe MapLibre `transformRequest` callback.
 *
 * Security guarantees:
 * - Parses URLs via `new URL()` (never naive substring replacement).
 * - Only rewrites `app.olamaps.io` → `api.olamaps.io`.
 * - Strictly restricts `api_key` and `Authorization` attachment to `*.olamaps.io` hosts,
 *   preventing credential leakage to third-party sprite, glyph, or overlay domains.
 * - Supports Proxy Mode via `proxyBaseUrl` so browser maps never need raw API keys.
 */
export function getTransformRequest(
  options: MapLibreTransformOptions = {},
): MapLibreTransformRequest {
  const { apiKey, accessToken, proxyBaseUrl } = options;
  const normalizedProxyBase = proxyBaseUrl ? proxyBaseUrl.replace(/\/+$/, '') : undefined;

  return (rawUrl: string): MapLibreRequestParameters => {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      // Relative URL (e.g. already pointing to a same-origin proxy path)
      return { url: rawUrl };
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { url: rawUrl };
    }

    if (!isOlaMapsHost(parsed.hostname)) {
      return { url: rawUrl };
    }

    // Rewrite legacy app.olamaps.io tile references strictly by hostname
    if (parsed.hostname.toLowerCase() === 'app.olamaps.io') {
      parsed.hostname = 'api.olamaps.io';
    }

    // Proxy mode: route Ola Maps requests through server proxy without exposing secrets
    if (normalizedProxyBase) {
      parsed.searchParams.delete('api_key');
      const proxiedUrl = `${normalizedProxyBase}${parsed.pathname}${parsed.search}`;
      return { url: proxiedUrl };
    }

    if (accessToken) {
      return {
        url: parsed.toString(),
        headers: { Authorization: `Bearer ${accessToken}` },
      };
    }

    if (apiKey) {
      parsed.searchParams.set('api_key', apiKey);
      return { url: parsed.toString() };
    }

    return { url: parsed.toString() };
  };
}

/**
 * Build a complete, ready-to-use MapLibre GL `Map` options object.
 */
export function getMapOptions(
  auth: MapLibreTransformOptions,
  options: MapLibreMapOptionsInput = {},
): MapLibreMapOptions {
  const { style, center, zoom, baseUrl, ...rest } = options;
  const effectiveBaseUrl = baseUrl ?? auth.proxyBaseUrl ?? DEFAULT_BASE_URL;

  const resolvedStyle =
    typeof style === 'object' && style !== null
      ? style
      : typeof style === 'string' && /^https?:\/\//i.test(style)
        ? style
        : getStyleURL(style ?? 'default-light-standard', effectiveBaseUrl);

  return {
    ...rest,
    container: options.container,
    style: resolvedStyle,
    center: center ?? [77.61, 12.93],
    zoom: zoom ?? 14,
    transformRequest: getTransformRequest(auth),
  };
}
