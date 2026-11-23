'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface CodeTab {
  id: string;
  label: string;
  filename: string;
  badge: string;
  code: string;
}

const CODE_TABS: readonly CodeTab[] = [
  {
    id: 'core',
    label: 'Core TS',
    filename: 'route.ts',
    badge: 'ola-map-sdk',
    code: `import { OlaMapsClient } from 'ola-map-sdk';

const client = new OlaMapsClient({
  apiKey: process.env.OLA_MAPS_API_KEY!,
  retries: { maxRetries: 2, baseDelayMs: 300 },
  cache: { ttlMs: 30_000, maxEntries: 200 },
});

// Accepts { lat, lng }, { lat, lon }, [lng, lat], or "lat,lng"
const route = await client.routing.getDirections(
  { lat: 12.993103, lng: 77.543326 },
  { lat: 12.972006, lng: 77.580085 },
  { mode: 'driving', traffic_metadata: true },
);

console.log(route.routes[0]?.legs[0]?.readable_duration);`,
  },
  {
    id: 'next',
    label: 'Next.js Proxy',
    filename: 'app/api/ola-maps/[...path]/route.ts',
    badge: 'ola-map-sdk/next',
    code: `import { createOlaMapsProxyHandler } from 'ola-map-sdk/next';

// Server-side proxy: strips client credentials, allowlists Ola Maps paths
export const { GET, POST, PUT, DELETE } = createOlaMapsProxyHandler({
  apiKey: process.env.OLA_MAPS_API_KEY!,
  cacheControl: 'public, s-maxage=60, stale-while-revalidate=300',
  authorize: async (req) => {
    return Boolean(req.headers.get('x-app-session'));
  },
});`,
  },
  {
    id: 'react',
    label: 'React Hooks',
    filename: 'components/PlaceSearch.tsx',
    badge: 'ola-map-sdk/react',
    code: `'use client';

import { useState } from 'react';
import { OlaMapsProvider, useOlaAutocomplete } from 'ola-map-sdk/react';

function SearchBox() {
  const [query, setQuery] = useState('');
  const { predictions, loading } = useOlaAutocomplete(query, {
    debounceMs: 250,
    minLength: 2,
    location: { lat: 12.9716, lng: 77.5946 },
  });

  return (
    <input value={query} onChange={(e) => setQuery(e.target.value)} />
  );
}

export default () => (
  <OlaMapsProvider config={{ baseUrl: '/api/ola-maps' }}>
    <SearchBox />
  </OlaMapsProvider>
);`,
  },
  {
    id: 'maplibre',
    label: 'MapLibre GL',
    filename: 'components/OlaMap.ts',
    badge: 'ola-map-sdk/maplibre',
    code: `import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getMapOptions } from 'ola-map-sdk/maplibre';

// transformRequest only attaches credentials to *.olamaps.io URLs
const map = new maplibregl.Map(
  getMapOptions(
    { proxyBaseUrl: '/api/ola-maps' },
    {
      container: 'map',
      style: 'default-dark-standard-satellite',
      center: [77.61, 12.93],
      zoom: 14,
    },
  ),
);`,
  },
  {
    id: 'oauth',
    label: 'OAuth 2.0',
    filename: 'server/ola-client.ts',
    badge: 'client_credentials',
    code: `import { OlaMapsClient } from 'ola-map-sdk';

// Single-flight token exchange, proactive refresh, and 401 retry
const client = new OlaMapsClient({
  clientId: process.env.OLA_CLIENT_ID!,
  clientSecret: process.env.OLA_CLIENT_SECRET!,
  tokenRefreshBufferMs: 60_000,
});

const { imageId } = await client.streetView.getImageId(12.934698, 77.613462, {
  radius: 50,
});
const panorama = await client.streetView.getMetadata(imageId);`,
  },
];

export function HeroCodeTabs() {
  const [activeId, setActiveId] = useState<string>(CODE_TABS[0].id);
  const [copied, setCopied] = useState(false);

  const current = CODE_TABS.find((t) => t.id === activeId) ?? CODE_TABS[0];

  async function handleCopy() {
    await navigator.clipboard.writeText(current.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="w-full max-w-full min-w-0 border border-fd-border bg-[#0a0a0a] text-neutral-100">
      {/* Tab bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 bg-[#111111] px-2.5 py-2">
        <div className="flex flex-wrap items-center gap-1">
          {CODE_TABS.map((tab) => {
            const isActive = tab.id === current.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-black'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex shrink-0 items-center gap-1.5 border border-neutral-800 bg-[#0a0a0a] px-2.5 py-1 font-mono text-[11px] text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="size-3 text-white" />
              Copied
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* File header */}
      <div className="flex min-w-0 items-center justify-between gap-2 border-b border-neutral-800 bg-[#0d0d0d] px-4 py-2 font-mono text-[11px] text-neutral-400">
        <span className="min-w-0 truncate text-neutral-300">{current.filename}</span>
        <span className="shrink-0 border border-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
          {current.badge}
        </span>
      </div>

      {/* Code viewport */}
      <div className="w-full max-w-full overflow-x-auto p-4 sm:p-5">
        <pre className="font-mono text-[12px] leading-relaxed text-neutral-200 sm:text-[13px]">
          <code>
            {current.code.split('\n').map((line, idx) => (
              <div key={`${current.id}-${idx}`} className="table-row">
                <span className="table-cell select-none pr-4 text-right text-[11px] text-neutral-600">
                  {idx + 1}
                </span>
                <span className="table-cell whitespace-pre">
                  {line.trimStart().startsWith('//') ? (
                    <span className="text-neutral-500">{line}</span>
                  ) : (
                    line
                  )}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
