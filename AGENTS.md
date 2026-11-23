# AGENTS.md

Guidance for AI coding agents and contributors working in `ola-map-sdk`.

## Project Overview

`ola-map-sdk` is a lightweight, **zero-runtime-dependency** TypeScript SDK for the Ola Maps Platform (`https://api.olamaps.io`). It targets Node.js 18+, modern browsers, Next.js (App Router & Edge), React, Vite, Cloudflare Workers, Bun, and Deno, and ships dual ESM + CJS builds with four package exports:

- `ola-map-sdk` (`src/index.ts`) — core client, endpoints, errors, validators, and types
- `ola-map-sdk/maplibre` (`src/maplibre/index.ts`) — host-safe MapLibre GL helpers
- `ola-map-sdk/next` (`src/next/index.ts`) — SSRF-safe Next.js App Router proxy handler
- `ola-map-sdk/react` (`src/react/index.ts`) — React context provider and hooks (`'use client'`)

## Repository Layout

```text
src/
  index.ts                  # Main entry point (default + named exports)
  client.ts                 # OlaMapsClient orchestrating auth, transport, endpoints & MapLibre helpers
  core/
    auth.ts                 # AuthManager (API Key, OAuth 2.0 client_credentials, Bearer, Proxy Mode)
    errors.ts               # Typed OlaMapsError subclasses + secret/URL redaction
    transport.ts            # Unified Web fetch HttpTransport (timeouts, retries, dedupe, LRU+TTL cache)
    validate.ts             # Coordinate normalization & fail-fast input validators
  endpoints/
    places.ts               # /places/v1/* (10 methods: autocomplete, geocode, nearby, details, etc.)
    routing.ts              # /routing/v1/* (directions, distanceMatrix, routeOptimizer, fleetPlanner)
    roads.ts                # /routing/v1/snapToRoad, nearestRoads, speedLimits
    geofencing.ts           # /places/v1/geofence* (CRUD, list, status)
    elevation.ts            # /places/v1/elevation (single & multi)
    tiles.ts                # /tiles/vector/v1/* & /tiles/v1/* (styles, PBF, raster, glyphs, static, 3D)
    streetview.ts           # /sli/v1/streetview/coverage & /sli/streetview/{imageId,metadata}
  maplibre/index.ts         # Host-safe getTransformRequest, getStyleURL, getMapOptions
  next/index.ts             # createOlaMapsProxyHandler for Next.js Route Handlers
  react/index.ts            # OlaMapsProvider, useOlaAutocomplete, useOlaDirections, useOlaReverseGeocode
  types/                    # Strict TypeScript request/response interfaces per module
tests/
  helpers.ts                # Shared fetch mock & response builders
  client.test.ts            # Client constructor & MapLibre convenience tests
  core/                     # Auth, transport, errors/redaction, validation unit tests
  endpoints/                # Endpoint-level tests for all 7 endpoint suites
  adapters/                 # MapLibre, Next.js proxy, and React hooks (happy-dom) tests
```

## Architecture & Invariants (Do Not Violate)

1. **Zero runtime dependencies**: Never add packages to `dependencies` in `package.json`. Use standard Web APIs (`fetch`, `URL`, `URLSearchParams`, `FormData`, `Blob`, `AbortController`, `crypto.randomUUID()` with fallback). Never import Node-only built-ins (`fs`, `path`, `http`, `Buffer`) inside `src/`.
2. **Backward-compatible constructor**: `new OlaMapsClient('api-key')` must always continue working alongside `new OlaMapsClient(config)`.
3. **All HTTP calls go through `HttpTransport`**: Endpoint classes in `src/endpoints/` must never call `fetch` directly or wrap requests in ad-hoc `try/catch` + `console.error`. Let `HttpTransport` handle auth, tracing headers, retries, timeouts, deduplication, caching, and typed error mapping.
4. **Never leak secrets**:
   - All error messages, error `.url` fields, and `onRequest` / `onResponse` hook URLs must pass through `redactSecrets` / `redactUrl`.
   - `getTransformRequest()` in `src/maplibre/index.ts` must parse URLs with `new URL()` and attach credentials **strictly** to `*.olamaps.io` hosts (`isOlaMapsHost`).
   - `createOlaMapsProxyHandler()` in `src/next/index.ts` must strip client-supplied `api_key` / `client_secret` / `access_token`, reject path traversal (`..`, `\\`, `//`, `@`, control chars), and enforce `allowedPrefixes`.
5. **Silent library policy**: Never call `console.error` on request failures (throw typed `OlaMapsError` subclasses instead). The only permitted warning is the opt-out browser `clientSecret` warning in `AuthManager`.
6. **Fail-fast client validation**:
   - Accept `{ lat, lng }`, `{ lat, lon }`, `[lng, lat]`, and `"lat,lng"` via `normalizeCoordinate` / `formatLatLng` / `formatCoordinateList`.
   - Enforce Ola Maps documented caps upfront (`nearbySearch` limit ≤ 50, `routeOptimizer` ≤ 25, `snapToRoad` ≤ 50, `nearestRoads` ≤ 100, `speedLimits` ≤ 50, `getMultiElevation` ≤ 25, static map dimensions 1–2048, `getStaticMapAuto` requires `marker` or `path`).
7. **React `'use client'` directive**: `tsup.config.ts` prepends `'use client';` to `dist/react/index.js` and `dist/react/index.cjs` in `onSuccess` so Next.js App Router treats `ola-map-sdk/react` as a Client Component module while keeping shared chunks clean.
8. **Query array serialization**: Repeated query params (like static map `marker`) must serialize as `marker=a&marker=b` via `appendQueryParams`, never `marker[]=`.

## Commands

Run all verification steps before finishing any change:

```bash
npm run typecheck     # tsc --noEmit (strict TypeScript)
npm run lint          # biome check src tests
npm run lint:fix      # biome check --write src tests
npm run test          # vitest run
npm run test:coverage # vitest run --coverage
npm run build         # tsup (ESM + CJS + .d.ts/.d.cts + sourcemaps)
npm run check:pkg     # publint --strict && attw --pack --profile node16
npm run check         # Runs typecheck, lint, test, build, and check:pkg in sequence
```

## Coding & Testing Conventions

- **TypeScript**: Strict mode (`strict: true`, `noUncheckedIndexedAccess: true`, `verbatimModuleSyntax: true`). Use `.js` extensions on relative ESM imports inside `src/` and `tests/`.
- **Formatting & Linting**: Managed by Biome (`biome.json` — single quotes, 2-space indent, semicolons, 100-char line width).
- **Tests**:
  - Use `createMockFetch`, `createJsonResponse`, and `createBinaryResponse` from `tests/helpers.ts` — unit tests must never make live network requests.
  - React hook tests use `// @vitest-environment happy-dom`.
  - Any new endpoint, parameter, or validation rule must include unit tests covering both the happy path (verified URL/method/headers/body) and validation/error cases.
- **Package integrity**: Whenever changing exports in `src/index.ts`, `tsup.config.ts`, or `package.json`, verify `npm run build && npm run check:pkg` passes with zero `publint` errors and green `attw` checks across all subpaths.
