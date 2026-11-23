export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'https://ola-map-sdk.vercel.app';

export const SITE_NAME = 'Ola Map SDK';
export const SITE_VERSION = 'v2.0.0';
export const SITE_DESCRIPTION =
  'Zero-dependency TypeScript SDK for the Ola Maps API: Places, Routing, Roads, Street View, Geofencing, Elevation, Tiles, OAuth 2.0, Next.js Proxy, React Hooks, and MapLibre GL.';

export const GITHUB_URL = 'https://github.com/kunalkcube/ola-map-sdk';
export const NPM_URL = 'https://www.npmjs.com/package/ola-map-sdk';
export const ISSUES_URL = 'https://github.com/kunalkcube/ola-map-sdk/issues';

export interface FaqItem {
  question: string;
  answer: string;
}

export const LANDING_FAQS: readonly FaqItem[] = [
  {
    question: 'Does ola-map-sdk v2.0 have any runtime dependencies?',
    answer:
      'No. ola-map-sdk v2.0 has zero runtime dependencies and uses standard Web APIs (fetch, URLSearchParams, FormData, Blob, AbortController, and Web Crypto), running in Node.js 18+, modern browsers, Next.js Edge, Cloudflare Workers, Bun, and Deno.',
  },
  {
    question: 'How do I keep my Ola Maps API key hidden in Next.js or React apps?',
    answer:
      'Use Proxy Mode with ola-map-sdk/next. Export { GET, POST, PUT, DELETE } = createOlaMapsProxyHandler({ apiKey: process.env.OLA_MAPS_API_KEY! }) in app/api/ola-maps/[...path]/route.ts, and initialize your browser client or <OlaMapsProvider> with { baseUrl: "/api/ola-maps" }.',
  },
  {
    question: 'Does ola-map-sdk support Ola Maps OAuth 2.0 client_credentials authentication?',
    answer:
      'Yes. Pass { clientId, clientSecret } to OlaMapsClient on the server. The SDK exchanges tokens at https://api.olamaps.io/auth/v1/token, deduplicates concurrent token requests, refreshes 60 seconds before expiry, and retries once on HTTP 401.',
  },
  {
    question: 'Which coordinate formats are accepted across SDK methods?',
    answer:
      'Every coordinate parameter accepts { lat, lng }, { lat, lon }, [lng, lat] (GeoJSON / MapLibre order), or "lat,lng" strings, with local range validation (-90..90 latitude, -180..180 longitude).',
  },
  {
    question: 'Does v2.0 support Street View and MapLibre GL?',
    answer:
      'Yes. v2.0 adds client.streetView (getCoverage, getImageId, getMetadata) and the ola-map-sdk/maplibre subpath export with 27 typed map styles and a host-safe transformRequest that restricts credentials to *.olamaps.io domains.',
  },
  {
    question: 'Is there an llms.txt endpoint for AI tools?',
    answer:
      'Yes. Fetch /llms.txt for the documentation index, /llms-full.txt for the full documentation as one Markdown file, or append .md to any docs page URL (such as /docs/api/places.md).',
  },
];
