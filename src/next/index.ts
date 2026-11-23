import { AuthManager, DEFAULT_BASE_URL } from '../core/auth.js';
import { OlaAuthError, OlaValidationError } from '../core/errors.js';
import { generateUUID } from '../core/transport.js';
import type { FetchLike } from '../types/common.js';

export const DEFAULT_ALLOWED_PROXY_PREFIXES: readonly string[] = [
  '/places/v1/',
  '/routing/v1/',
  '/tiles/v1/',
  '/tiles/vector/v1/',
  '/sli/v1/streetview/',
  '/sli/streetview/',
];

export const DEFAULT_ALLOWED_PROXY_METHODS: readonly string[] = ['GET', 'POST', 'PUT', 'DELETE'];

export interface OlaMapsProxyConfig {
  /** Server-side Ola Maps API key. */
  apiKey?: string;
  /** Server-side OAuth 2.0 Client ID (requires `clientSecret`). */
  clientId?: string;
  /** Server-side OAuth 2.0 Client Secret (requires `clientId`). */
  clientSecret?: string;
  /** OAuth 2.0 scope (default: `'openid'`). */
  scope?: string;
  /** OAuth 2.0 token endpoint (default: `'https://api.olamaps.io/auth/v1/token'`). */
  tokenUrl?: string;
  /** Upstream Ola Maps API origin (default: `'https://api.olamaps.io'`). */
  upstreamBaseUrl?: string;
  /** Route prefix stripped when deriving upstream path from `request.url` (default: `'/api/ola-maps'`). */
  basePath?: string;
  /** Allowlisted upstream path prefixes (prevents SSRF and open-proxy abuse). */
  allowedPrefixes?: readonly string[];
  /** Allowed HTTP methods (default: `['GET', 'POST', 'PUT', 'DELETE']`). */
  allowedMethods?: readonly string[];
  /** Custom `fetch` implementation. */
  fetch?: FetchLike;
  /** Optional `Cache-Control` header applied to successful `GET` responses. */
  cacheControl?: string;
  /**
   * Optional authorization hook run before forwarding to Ola Maps.
   * Return `false` to respond with 403, or return a custom `Response` to short-circuit.
   */
  authorize?: (request: Request) => boolean | Response | Promise<boolean | Response>;
}

export interface NextRouteContext {
  params?: { path?: string[] | string } | Promise<{ path?: string[] | string }>;
}

export type NextRouteHandler = (request: Request, context?: NextRouteContext) => Promise<Response>;

export interface OlaMapsProxyHandlers {
  handler: NextRouteHandler;
  GET: NextRouteHandler;
  POST: NextRouteHandler;
  PUT: NextRouteHandler;
  DELETE: NextRouteHandler;
}

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function hasUnsafePathSegments(rawPath: string): boolean {
  let decoded = rawPath;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return true;
  }
  if (
    decoded.includes('..') ||
    decoded.includes('\\') ||
    decoded.includes('//') ||
    decoded.includes('@') ||
    /[\r\n\0]/.test(decoded)
  ) {
    return true;
  }
  return false;
}

async function resolveUpstreamPath(
  request: Request,
  context: NextRouteContext | undefined,
  basePath: string,
): Promise<string | null> {
  if (context?.params) {
    const resolvedParams = await context.params;
    const pathParam = resolvedParams?.path;
    if (Array.isArray(pathParam) && pathParam.length > 0) {
      return `/${pathParam.join('/')}`;
    }
    if (typeof pathParam === 'string' && pathParam.length > 0) {
      return pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
    }
  }

  const reqUrl = new URL(request.url);
  const normalizedBase = basePath.replace(/\/+$/, '');
  if (!reqUrl.pathname.startsWith(`${normalizedBase}/`)) {
    return null;
  }
  return reqUrl.pathname.slice(normalizedBase.length);
}

/**
 * Create a drop-in Next.js App Router Route Handler proxy (`app/api/ola-maps/[...path]/route.ts`)
 * that keeps your Ola Maps API key or OAuth 2.0 credentials strictly on the server.
 *
 * @example
 * ```ts
 * // app/api/ola-maps/[...path]/route.ts
 * import { createOlaMapsProxyHandler } from 'ola-map-sdk/next';
 *
 * export const { GET, POST, PUT, DELETE } = createOlaMapsProxyHandler({
 *   apiKey: process.env.OLA_MAPS_API_KEY!,
 * });
 * ```
 */
export function createOlaMapsProxyHandler(config: OlaMapsProxyConfig): OlaMapsProxyHandlers {
  const fetchImpl = config.fetch ?? globalThis.fetch?.bind(globalThis);
  if (!fetchImpl) {
    throw new OlaValidationError('No global fetch implementation found. Pass config.fetch.');
  }

  const auth = new AuthManager(
    {
      apiKey: config.apiKey,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      scope: config.scope,
      tokenUrl: config.tokenUrl,
      suppressBrowserWarning: true,
    },
    fetchImpl,
  );

  if (auth.mode === 'proxy') {
    throw new OlaValidationError(
      'createOlaMapsProxyHandler requires server credentials: apiKey or { clientId, clientSecret }.',
    );
  }

  const upstreamOrigin = (config.upstreamBaseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
  const basePath = config.basePath ?? '/api/ola-maps';
  const allowedPrefixes = config.allowedPrefixes ?? DEFAULT_ALLOWED_PROXY_PREFIXES;
  const allowedMethods = new Set(
    (config.allowedMethods ?? DEFAULT_ALLOWED_PROXY_METHODS).map((m) => m.toUpperCase()),
  );

  const handler: NextRouteHandler = async (request, context) => {
    const method = request.method.toUpperCase();
    if (!allowedMethods.has(method)) {
      return jsonError(405, `Method ${method} not allowed`);
    }

    if (config.authorize) {
      const verdict = await config.authorize(request);
      if (verdict instanceof Response) {
        return verdict;
      }
      if (!verdict) {
        return jsonError(403, 'Forbidden');
      }
    }

    const upstreamPath = await resolveUpstreamPath(request, context, basePath);
    if (!upstreamPath || hasUnsafePathSegments(upstreamPath)) {
      return jsonError(400, 'Invalid upstream path');
    }

    const isAllowed = allowedPrefixes.some((prefix) => upstreamPath.startsWith(prefix));
    if (!isAllowed) {
      return jsonError(403, 'Upstream path is not permitted by proxy allowlist');
    }

    const incomingUrl = new URL(request.url);
    const upstreamUrl = new URL(`${upstreamOrigin}${upstreamPath}`);

    // Copy query params while stripping client-supplied credentials
    for (const [key, value] of incomingUrl.searchParams.entries()) {
      const lower = key.toLowerCase();
      if (lower === 'api_key' || lower === 'client_secret' || lower === 'access_token') {
        continue;
      }
      upstreamUrl.searchParams.append(key, value);
    }

    const forwardHeaders = new Headers();
    const accept = request.headers.get('accept');
    if (accept) forwardHeaders.set('Accept', accept);

    const contentType = request.headers.get('content-type');
    if (contentType && method !== 'GET' && method !== 'HEAD') {
      forwardHeaders.set('Content-Type', contentType);
    }

    forwardHeaders.set('X-Request-Id', request.headers.get('x-request-id') ?? generateUUID());
    forwardHeaders.set(
      'X-Correlation-Id',
      request.headers.get('x-correlation-id') ?? generateUUID(),
    );

    try {
      await auth.applyAuth(upstreamUrl, forwardHeaders);
    } catch (error) {
      if (error instanceof OlaAuthError) {
        return jsonError(502, 'Upstream authentication failed');
      }
      return jsonError(500, 'Internal proxy error');
    }

    const hasBody = method !== 'GET' && method !== 'HEAD';
    const bodyBuffer = hasBody ? await request.arrayBuffer() : undefined;

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetchImpl(upstreamUrl.toString(), {
        method,
        headers: forwardHeaders,
        body: bodyBuffer && bodyBuffer.byteLength > 0 ? bodyBuffer : undefined,
        signal: request.signal,
      });
    } catch {
      return jsonError(502, 'Failed to reach Ola Maps upstream API');
    }

    const responseHeaders = new Headers();
    const upstreamContentType = upstreamResponse.headers.get('content-type');
    if (upstreamContentType) {
      responseHeaders.set('Content-Type', upstreamContentType);
    }

    const upstreamCacheControl = upstreamResponse.headers.get('cache-control');
    if (method === 'GET' && upstreamResponse.ok && config.cacheControl) {
      responseHeaders.set('Cache-Control', config.cacheControl);
    } else if (upstreamCacheControl) {
      responseHeaders.set('Cache-Control', upstreamCacheControl);
    }

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  };

  return {
    handler,
    GET: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
  };
}
