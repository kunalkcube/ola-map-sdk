# ola-map-sdk

> Lightweight, zero-dependency, TypeScript-first SDK for **Ola Maps** — built for Node.js 18+, Browsers, Next.js (App Router & Edge), React, Vite, Cloudflare Workers, Bun, and Deno.

## Why v2.0?

- **Zero runtime dependencies** — uses native Web APIs (`fetch`, `URLSearchParams`, `FormData`, `Blob`, `AbortController`, Web Crypto). No `axios`, `uuid`, or `form-data`.
- **Complete Ola Maps API coverage** — Places, Geocoding, Routing, Roads, Geofencing, Elevation, Tiles (Vector, Raster, Static, 3D), **Street View**, and **OAuth 2.0 (`client_credentials`)**.
- **Fast & lightweight** — concurrent in-flight `GET` deduplication, optional LRU+TTL caching, single-flight OAuth token caching & proactive refresh, and tree-shakeable ESM + CJS builds.
- **Production-ready transport** — configurable timeouts, per-request `AbortSignal`, exponential backoff retries with jitter & `Retry-After`, per-request `X-Request-Id` / `X-Correlation-Id`, typed error hierarchy, and `onRequest` / `onResponse` observability hooks.
- **Secure by default** — strict `*.olamaps.io` host validation in MapLibre `transformRequest`, automatic secret redaction in errors/hooks, and a drop-in SSRF-safe proxy handler (`ola-map-sdk/next`).
- **Modular subpath exports** — `ola-map-sdk/maplibre`, `ola-map-sdk/next`, and `ola-map-sdk/react` (pay zero bundle cost for adapters you don't import).
- **Smooth v1 upgrade** — `new OlaMapsClient('YOUR_API_KEY')` remains supported alongside the v2 config object.

---

## Installation

```bash
npm install ola-map-sdk
```

> **Requirements:** Node.js 18+ (or any modern browser / Edge runtime with Web `fetch`). Optional peer dependencies (`maplibre-gl`, `next`, `react`) are only needed if you use their respective subpath exports.

---

## Quick Start

```ts
import OlaMapsClient from 'ola-map-sdk';
// or: import { OlaMapsClient } from 'ola-map-sdk';

// v1 shorthand (still supported)
const client = new OlaMapsClient('YOUR_API_KEY');

// v2 config object
const clientV2 = new OlaMapsClient({
  apiKey: process.env.OLA_MAPS_API_KEY!,
  timeoutMs: 10_000,
  retries: { maxRetries: 2, baseDelayMs: 300 },
  cache: { ttlMs: 30_000, maxEntries: 200 },
});

// Autocomplete places
const places = await clientV2.places.autocomplete('Koramangala, Bengaluru');

// Directions — accepts { lat, lng }, { lat, lon }, [lng, lat], or "lat,lng"
const route = await clientV2.routing.getDirections(
  { lat: 12.993103, lng: 77.543326 },
  { lat: 12.972006, lng: 77.580085 },
  { mode: 'driving', traffic_metadata: true },
);
```

---

## Configuration Options

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | — | Ola Maps API key (attached via `api_key` query param). |
| `clientId` / `clientSecret` | `string` | — | OAuth 2.0 `client_credentials` (server-side only). |
| `scope` | `string` | `'openid'` | OAuth 2.0 scope. |
| `tokenUrl` | `string` | `'https://api.olamaps.io/auth/v1/token'` | OAuth 2.0 token endpoint. |
| `tokenRefreshBufferMs` | `number` | `60000` | Proactively refresh OAuth token before expiry. |
| `accessToken` | `string \| (() => string \| Promise<string>)` | — | Static or async Bearer token provider. |
| `baseUrl` | `string` | `'https://api.olamaps.io'` | Override for Proxy Mode (e.g. `'/api/ola-maps'`). |
| `fetch` | `FetchLike` | `globalThis.fetch` | Custom `fetch` (Next.js cache options, proxies, mocks). |
| `timeoutMs` | `number` | `15000` | Default per-request timeout in ms. |
| `retries` | `RetryConfig \| false` | `{ maxRetries: 2 }` | Exponential backoff + jitter for `408`/`429`/`5xx` and network errors. |
| `cache` | `CacheConfig \| false` | `false` | Optional in-memory LRU+TTL cache for `GET` requests. |
| `dedupe` | `boolean` | `true` | Deduplicate concurrent identical in-flight `GET` requests. |
| `defaultHeaders` | `Record<string, string>` | `{}` | Extra headers merged onto every request. |
| `onRequest` / `onResponse` | `Function` | — | Observability hooks (URLs are automatically redacted). |

---

## Authentication Modes

### 1. API Key

```ts
const client = new OlaMapsClient({ apiKey: process.env.OLA_MAPS_API_KEY! });
```

### 2. OAuth 2.0 (`client_credentials`, server-side)

Exchanges credentials at `POST https://api.olamaps.io/auth/v1/token`, deduplicates concurrent token fetches, refreshes proactively before expiry, and automatically retries once on `401`.

```ts
const client = new OlaMapsClient({
  clientId: process.env.OLA_CLIENT_ID!,
  clientSecret: process.env.OLA_CLIENT_SECRET!,
});

const token = await client.getAccessToken();
```

### 3. Pre-issued Bearer Token

```ts
const client = new OlaMapsClient({
  accessToken: async () => fetchMyCachedToken(),
});
```

### 4. Proxy Mode (recommended for React & Next.js browsers)

Keep secrets strictly on your server by pointing the browser client at your own proxy route:

```ts
const client = new OlaMapsClient({
  baseUrl: '/api/ola-maps',
});
```

---

## Subpath Exports

### Next.js App Router Proxy (`ola-map-sdk/next`)

Drop-in catch-all route handler (`app/api/ola-maps/[...path]/route.ts`) that injects server credentials, strips client-supplied keys, blocks path traversal / SSRF outside Ola Maps prefixes, supports optional `authorize(request)`, and streams JSON + binary tiles cleanly:

```ts
// app/api/ola-maps/[...path]/route.ts
import { createOlaMapsProxyHandler } from 'ola-map-sdk/next';

export const { GET, POST, PUT, DELETE } = createOlaMapsProxyHandler({
  apiKey: process.env.OLA_MAPS_API_KEY!,
  // Or use server-side OAuth 2.0:
  // clientId: process.env.OLA_CLIENT_ID!,
  // clientSecret: process.env.OLA_CLIENT_SECRET!,
  cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
});
```

In Server Components, pass Next.js's extended `fetch` for built-in caching/revalidation:

```ts
const client = new OlaMapsClient({
  apiKey: process.env.OLA_MAPS_API_KEY!,
  fetch: (url, init) => fetch(url, { ...init, next: { revalidate: 300 } }),
});
```

### React Hooks (`ola-map-sdk/react`)

Includes `<OlaMapsProvider>`, `useOlaMapsClient`, `useOlaAutocomplete` (debounced + automatic `AbortController` cancellation on keystrokes/unmount), `useOlaDirections`, and `useOlaReverseGeocode`.

```tsx
'use client';

import { useState } from 'react';
import { OlaMapsProvider, useOlaAutocomplete } from 'ola-map-sdk/react';

function SearchBox() {
  const [query, setQuery] = useState('');
  const { predictions, loading, error } = useOlaAutocomplete(query, {
    debounceMs: 250,
    minLength: 2,
  });

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search places..."
      />
      {loading && <p>Searching...</p>}
      {error && <p>{error.message}</p>}
      <ul>
        {predictions.map((p) => (
          <li key={p.place_id}>{p.description}</li>
        ))}
      </ul>
    </div>
  );
}

export default function App() {
  return (
    <OlaMapsProvider config={{ baseUrl: '/api/ola-maps' }}>
      <SearchBox />
    </OlaMapsProvider>
  );
}
```

### MapLibre GL Integration (`ola-map-sdk/maplibre`)

`getTransformRequest` parses every URL with `new URL()` and **only** attaches credentials or rewrites `app.olamaps.io` → `api.olamaps.io` for verified `*.olamaps.io` hosts—preventing credential leaks to third-party overlay/sprite/font domains.

```ts
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapOptions } from 'ola-map-sdk/maplibre';

// Proxy mode (recommended — no API key in browser)
const map = new maplibregl.Map(
  getMapOptions(
    { proxyBaseUrl: '/api/ola-maps' },
    {
      container: 'map',
      style: 'default-light-standard',
      center: [77.61, 12.93],
      zoom: 14,
    },
  ),
);
```

Convenience helpers (`client.getStyleURL()`, `client.getTransformRequest()`, `client.getMapOptions()`) are also available directly on `OlaMapsClient`.

#### Built-in Map Styles (`OLA_MAP_STYLES`)

| Category | Styles |
|---|---|
| **Default Light** | `default-light-lite`, `default-light-standard`, `default-ultra-light-standard`, `default-light-full` |
| **Default Dark & Satellite** | `default-dark-lite`, `default-dark-standard`, `default-dark-full`, `default-dark-standard-satellite` |
| **Eclipse** | `eclipse-light-lite`, `eclipse-light-standard`, `eclipse-light-full`, `eclipse-dark-lite`, `eclipse-dark-standard`, `eclipse-dark-full` |
| **Bolt / Vintage / Earth** | `bolt-light`, `bolt-dark`, `vintage-light`, `vintage-dark`, `default-earth-lite`, `default-earth-standard`, `default-earth-full` |
| **OSM** | `positron`, `osm-bright`, `osm-basic`, `dark-matter`, `fiord-color`, `silver-osm` |

---

## API Reference

Every endpoint method accepts flexible coordinates (`{ lat, lng }`, `{ lat, lon }`, `[lng, lat]`, or `"lat,lng"`) and an optional trailing `RequestOptions` argument (`{ signal, timeoutMs, requestId, correlationId, headers, retries, skipCache }`).

### Places & Geocoding (`client.places`)

```ts
await client.places.autocomplete('Bengaluru', { location: { lat: 12.93, lng: 77.61 }, radius: 5000 });
await client.places.geocode('Taj Mahal, Agra', { language: 'en' });
await client.places.reverseGeocode(12.931, 77.616); // also accepts numeric strings or { lat, lng }
await client.places.placeDetails('ola-platform:5000039498427');
await client.places.placeDetailsAdvanced('ola-platform:5000039498427');
await client.places.nearbySearch({ lat: 12.93, lng: 77.61 }, { layers: 'venue', types: 'cafe', limit: 25 }); // limit <= 50
await client.places.nearbySearchAdvanced('12.93,77.61', { layers: 'venue', rankBy: 'distance' });
await client.places.textSearch('Cafes in Koramangala');
await client.places.addressValidation('7, Lok Kalyan Marg, New Delhi');
await client.places.photo('photo_reference_id');
```

### Routing (`client.routing`)

```ts
await client.routing.getDirections({ lat: 12.993, lng: 77.543 }, { lat: 12.972, lng: 77.58 });
await client.routing.getDirectionsBasic([77.543, 12.993], [77.58, 12.972]);
await client.routing.getDistanceMatrix([{ lat: 12.993, lng: 77.543 }], [{ lat: 12.935, lng: 77.615 }]);
await client.routing.getDistanceMatrixBasic('12.993,77.543', '12.935,77.615');
await client.routing.routeOptimizer('12.993,77.543|12.972,77.58|12.935,77.615'); // max 25 locations
await client.routing.fleetPlanner({ packages: [], vehicles: [] }, 'optimal'); // Web FormData + Blob
```

### Roads (`client.roads`)

```ts
await client.roads.snapToRoad('12.999,77.673|12.992,77.658', true); // max 50 points
await client.roads.nearestRoads('12.999,77.673|12.992,77.658', 'DRIVING', 500); // max 100 points
await client.roads.speedLimits('13.063,77.593|13.064,77.594', 'snaptoroad'); // max 50 points
```

### Street View (`client.streetView`)

```ts
await client.streetView.getCoverage({ xMin: 77.611, yMin: 12.932, xMax: 77.615, yMax: 12.935 });
const { imageId } = await client.streetView.getImageId(12.934698, 77.613462, { radius: 50 });
const metadata = await client.streetView.getMetadata(imageId);
```

### Geofencing (`client.geofencing`)

```ts
await client.geofencing.create({
  name: 'Warehouse',
  type: 'circle',
  coordinates: [[12.931, 77.615]],
  radius: 100,
  status: 'active',
  projectId: 'my-project',
});
await client.geofencing.getById('fence-id');
await client.geofencing.update('fence-id', { name: 'Updated' });
await client.geofencing.deleteById('fence-id');
await client.geofencing.list('my-project', 1, 10);
await client.geofencing.checkStatus('fence-id', { lat: 12.93, lng: 77.61 });
```

### Elevation (`client.elevation`)

```ts
await client.elevation.getElevation(12.93126, 77.61638);
await client.elevation.getMultiElevation(['12.93126,77.61638', { lat: 12.89731, lng: 77.65136 }]); // max 25
```

### Tiles & Static Maps (`client.tiles`)

```ts
await client.tiles.getStyles();
await client.tiles.getStyleDetail('default-light-standard');
await client.tiles.getDataTileJSON('planet');
await client.tiles.getPBFFile('planet', 14, 110, 1010); // ArrayBuffer
await client.tiles.getRasterTile('default-light-standard', 14, 11722, 7613, 'png'); // ArrayBuffer
await client.tiles.getFontGlyphs('Noto Sans Bold', 0, 255); // ArrayBuffer
await client.tiles.get3DTileset();

// Static maps (width/height 1–2048; array markers serialize as marker=a&marker=b)
await client.tiles.getStaticMapByCenter('default-light-standard', 77.61, 12.93, 15, 800, 600, 'png', {
  marker: ['77.61,12.93|red', '77.62,12.94|blue'],
});
await client.tiles.getStaticMapByBBox(
  'default-light-standard',
  { minx: 77.5, miny: 12.9, maxx: 77.7, maxy: 13.0 },
  800,
  600,
  'png',
);
await client.tiles.getStaticMapAuto('default-light-standard', 800, 600, 'png', {
  marker: '77.61,12.93|red',
});
```

---

## Error Handling

All API, validation, timeout, and network failures throw typed subclasses of `OlaMapsError` with credentials automatically redacted (and zero `console.error` side effects):

```ts
import {
  OlaMapsError,
  OlaAuthError,
  OlaRateLimitError,
  OlaValidationError,
  OlaTimeoutError,
  OlaNetworkError,
} from 'ola-map-sdk';

try {
  await client.places.autocomplete('Bengaluru');
} catch (err) {
  if (err instanceof OlaRateLimitError) {
    console.log('Retry after (ms):', err.retryAfter);
  } else if (err instanceof OlaAuthError) {
    console.log('Auth failed:', err.status, err.requestId);
  } else if (err instanceof OlaMapsError) {
    console.log(err.code, err.status, err.url); // api_key is always REDACTED
  }
}
```

---

## Migrating from v1.x to v2.0

- **Node 18+ required** (native Web `fetch` & `FormData`; zero runtime dependencies).
- `new OlaMapsClient('YOUR_API_KEY')` still works out of the box.
- In CommonJS, prefer `const { OlaMapsClient } = require('ola-map-sdk')` (or `require('ola-map-sdk').default`).
- `fleetPlanner` no longer reads local filesystem paths directly (so it works in browsers & Edge runtimes); pass a plain object, JSON string, `Blob`, `Uint8Array`, or `ArrayBuffer` (e.g. `await fs.readFile('input.json')` on Node).
- `getStaticMapAuto` now validates that at least one `marker` or `path` is provided.
- Errors are now typed `OlaMapsError` subclasses and never log to `console.error`.

---

## Development

```bash
npm install
npm run check         # typecheck + biome lint + vitest + tsup build + publint + attw
npm run test:coverage # run tests with v8 coverage report
```

---

## License

MIT © Kunal Kongkan Kashyap
