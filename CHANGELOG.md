# Changelog

All notable changes to `ola-map-sdk` are documented in this file.

This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html) and follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format.

## [2.0.0] - 2026-11-23

Complete TypeScript rewrite with zero runtime dependencies, full Ola Maps API coverage, OAuth 2.0 support, and dedicated framework adapters.

### Added
- **Zero-dependency core**: Rewritten in strict TypeScript on native Web APIs (`fetch`, `URLSearchParams`, `FormData`, `Blob`, `AbortController`, and Web Crypto). Runs across Node.js 18+, browsers, Next.js Edge, Cloudflare Workers, Bun, and Deno.
- **Street View API (`client.streetView`)**: Added `getCoverage()`, `getImageId()`, and `getMetadata()`.
- **Authentication modes**:
  - Server-side OAuth 2.0 (`client_credentials`) with single-flight token exchange, proactive refresh before expiry, and automatic 401 retry.
  - Static or async `accessToken` Bearer token provider.
  - Browser Proxy Mode via `baseUrl` (no secrets shipped to client bundles).
- **Modular subpath exports** (dual ESM + CJS with `.d.ts` / `.d.cts` and `"sideEffects": false`):
  - `ola-map-sdk/next` — SSRF-safe App Router proxy handler (`createOlaMapsProxyHandler`) with prefix allowlisting, path-traversal protection, client-credential stripping, optional `authorize(request)` guard, and JSON/binary streaming.
  - `ola-map-sdk/react` — Client hooks (`<OlaMapsProvider>`, `useOlaMapsClient`, `useOlaAutocomplete`, `useOlaDirections`, `useOlaReverseGeocode`) with keystroke debouncing and `AbortController` cleanup.
  - `ola-map-sdk/maplibre` — Standalone `getStyleURL()`, host-safe `getTransformRequest()` (strict `*.olamaps.io` verification), `getMapOptions()`, `isOlaMapsHost()`, and 27 typed `OLA_MAP_STYLES`.
- **Resilient transport**: Configurable timeouts, per-request `AbortSignal`, exponential backoff with jitter and `Retry-After` handling, in-flight `GET` deduplication, opt-in LRU + TTL caching, per-request `X-Request-Id` / `X-Correlation-Id` headers, and `onRequest` / `onResponse` hooks.
- **Typed error hierarchy**: `OlaMapsError`, `OlaAuthError`, `OlaRateLimitError`, `OlaValidationError`, `OlaTimeoutError`, and `OlaNetworkError`, with automatic redaction of `api_key`, `client_secret`, and `Bearer` tokens.
- **Flexible coordinate inputs**: Every coordinate parameter accepts `{ lat, lng }`, `{ lat, lon }`, `[lng, lat]`, or `"lat,lng"` strings with local range validation.
- **Documentation site**: Added Fumadocs v2.0 documentation under `docs/` with `/llms.txt`, `/llms-full.txt`, and per-page `.md` routes.

### Breaking Changes
- **Node.js 18+ required** (removed `axios`, `uuid`, and `form-data` dependencies).
- **CommonJS imports**: Use `const { OlaMapsClient } = require('ola-map-sdk')` or `require('ola-map-sdk').default`.
- **`routing.fleetPlanner`**: No longer reads local filesystem paths via `fs` (for browser and Edge compatibility). Pass a JSON object, string, `Blob`, `Uint8Array`, or `ArrayBuffer`.
- **Local validation caps**: Enforces documented Ola Maps API limits locally (throwing `OlaValidationError`), including `nearbySearch` `limit` (`1..50`), `routeOptimizer` (`<= 25`), `snapToRoad` (`<= 50`), `nearestRoads` (`<= 100`), `speedLimits` (`<= 50`), `getMultiElevation` (`<= 25`), static map dimensions (`1..2048`), and requiring at least one `marker` or `path` in `getStaticMapAuto`.
- **Error shape & logging**: Throws typed `OlaMapsError` subclasses instead of raw `axios` errors and no longer logs to `console.error`.
- **MapLibre `transformRequest`**: Strictly restricts credential injection and `app.olamaps.io` → `api.olamaps.io` rewrites to verified `*.olamaps.io` hostnames.

## [1.3.0] - 2026-02-23

- Initial JavaScript implementation of Places, Routing, Roads, Geofencing, Elevation, and Tiles endpoints.
