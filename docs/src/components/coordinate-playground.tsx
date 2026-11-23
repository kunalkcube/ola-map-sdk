'use client';

import { Check, Copy } from 'lucide-react';
import { useMemo, useState } from 'react';

const STYLE_FAMILIES = [
  {
    name: 'Default Light',
    styles: [
      'default-light-lite',
      'default-light-standard',
      'default-ultra-light-standard',
      'default-light-full',
    ],
  },
  {
    name: 'Default Dark & Satellite',
    styles: [
      'default-dark-lite',
      'default-dark-standard',
      'default-dark-full',
      'default-dark-standard-satellite',
    ],
  },
  {
    name: 'Eclipse',
    styles: [
      'eclipse-light-lite',
      'eclipse-light-standard',
      'eclipse-light-full',
      'eclipse-dark-lite',
      'eclipse-dark-standard',
      'eclipse-dark-full',
    ],
  },
  {
    name: 'Bolt / Vintage / Earth',
    styles: [
      'bolt-light',
      'bolt-dark',
      'vintage-light',
      'vintage-dark',
      'default-earth-lite',
      'default-earth-standard',
      'default-earth-full',
    ],
  },
  {
    name: 'OSM',
    styles: ['positron', 'osm-bright', 'osm-basic', 'dark-matter', 'fiord-color', 'silver-osm'],
  },
] as const;

const COORD_PRESETS = [
  { label: '{ lat, lng }', value: '{ "lat": 12.9716, "lng": 77.5946 }' },
  { label: '{ lat, lon }', value: '{ "lat": 28.6139, "lon": 77.2090 }' },
  { label: '[lng, lat]', value: '[72.8777, 19.0760]' },
  { label: '"lat,lng"', value: '"13.0827,80.2707"' },
] as const;

function tryNormalize(
  raw: string,
): { ok: true; lat: number; lng: number; wire: string } | { ok: false; error: string } {
  try {
    const parsed: unknown = JSON.parse(raw);
    let lat: number;
    let lng: number;

    if (typeof parsed === 'string') {
      const parts = parsed.split(',');
      if (parts.length !== 2) return { ok: false, error: 'String must be "lat,lng" format' };
      lat = Number(parts[0].trim());
      lng = Number(parts[1].trim());
    } else if (Array.isArray(parsed)) {
      if (parsed.length !== 2) return { ok: false, error: 'Tuple must be [lng, lat] (2 numbers)' };
      lng = Number(parsed[0]);
      lat = Number(parsed[1]);
    } else if (parsed && typeof parsed === 'object') {
      const obj = parsed as Record<string, unknown>;
      const rawLng = obj.lng !== undefined ? obj.lng : obj.lon;
      if (obj.lat === undefined || rawLng === undefined) {
        return { ok: false, error: 'Object requires "lat" and "lng" (or "lon")' };
      }
      lat = Number(obj.lat);
      lng = Number(rawLng);
    } else {
      return { ok: false, error: 'Unsupported input type' };
    }

    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      return { ok: false, error: `OlaValidationError: lat must be between -90 and 90 (got ${lat})` };
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      return {
        ok: false,
        error: `OlaValidationError: lng must be between -180 and 180 (got ${lng})`,
      };
    }

    return { ok: true, lat, lng, wire: `${lat},${lng}` };
  } catch {
    return {
      ok: false,
      error: 'Enter valid JSON (e.g. {"lat": 12.93, "lng": 77.61} or [77.61, 12.93])',
    };
  }
}

export function CoordinatePlayground() {
  const [coordInput, setCoordInput] = useState<string>(COORD_PRESETS[0].value);
  const [selectedStyle, setSelectedStyle] = useState<string>('default-dark-standard-satellite');
  const [copiedStyle, setCopiedStyle] = useState(false);

  const normalized = useMemo(() => tryNormalize(coordInput), [coordInput]);

  const mapSnippet = `const map = new maplibregl.Map(
  getMapOptions(
    { proxyBaseUrl: '/api/ola-maps' },
    { container: 'map', style: '${selectedStyle}', center: [77.61, 12.93], zoom: 14 },
  ),
);`;

  async function copyStyleSnippet() {
    await navigator.clipboard.writeText(mapSnippet);
    setCopiedStyle(true);
    setTimeout(() => setCopiedStyle(false), 1800);
  }

  return (
    <div className="grid divide-y divide-fd-border border border-fd-border bg-fd-background lg:grid-cols-2 lg:divide-x lg:divide-y-0">
      {/* Coordinate normalizer */}
      <div className="flex min-w-0 flex-col justify-between p-5 sm:p-6">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-fd-foreground">Coordinate Normalizer</h3>
            <code className="border border-fd-border bg-fd-muted px-2 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
              normalizeCoordinate()
            </code>
          </div>
          <p className="mb-4 text-sm text-fd-muted-foreground">
            Test any input format accepted by v2.0. Out-of-range values fail locally with{' '}
            <code className="border border-fd-border bg-fd-muted px-1 py-0.5 font-mono text-xs text-fd-foreground">
              OlaValidationError
            </code>
            .
          </p>

          <div className="mb-3 flex flex-wrap gap-1.5">
            {COORD_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setCoordInput(preset.value)}
                className={`border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                  coordInput === preset.value
                    ? 'border-fd-foreground bg-fd-foreground text-fd-background'
                    : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:border-fd-foreground/50 hover:text-fd-foreground'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="sr-only">Coordinate input JSON</span>
            <input
              type="text"
              value={coordInput}
              onChange={(e) => setCoordInput(e.target.value)}
              className="w-full border border-fd-border bg-fd-muted/40 px-3.5 py-2.5 font-mono text-xs text-fd-foreground outline-none transition-colors focus:border-fd-foreground"
            />
          </label>
        </div>

        <div className="mt-4 overflow-hidden border border-fd-border bg-fd-muted/40 p-4 font-mono text-xs break-words">
          {normalized.ok ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-fd-foreground">
                <span className="inline-flex items-center gap-1 font-medium">
                  <Check className="size-3" /> Valid CoordinateInput
                </span>
                <span className="text-fd-muted-foreground">lat [-90, 90] · lng [-180, 180]</span>
              </div>
              <div className="text-fd-muted-foreground">
                Normalized:{' '}
                <span className="text-fd-foreground">
                  {`{ lat: ${normalized.lat}, lng: ${normalized.lng} }`}
                </span>
              </div>
              <div className="text-fd-muted-foreground">
                Wire format:{' '}
                <span className="font-semibold text-fd-foreground">
                  &quot;{normalized.wire}&quot;
                </span>
              </div>
            </div>
          ) : (
            <p className="border-l-2 border-fd-foreground pl-3 text-fd-foreground">
              {normalized.error}
            </p>
          )}
        </div>
      </div>

      {/* Built-in Style Explorer */}
      <div className="flex min-w-0 flex-col justify-between p-5 sm:p-6">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-semibold text-fd-foreground">
              27 Typed MapLibre Styles
            </h3>
            <code className="border border-fd-border bg-fd-muted px-2 py-0.5 font-mono text-[11px] text-fd-muted-foreground">
              OLA_MAP_STYLES
            </code>
          </div>

          <div className="space-y-3">
            {STYLE_FAMILIES.map((family) => (
              <div key={family.name}>
                <div className="mb-1.5 font-mono text-[11px] text-fd-muted-foreground">
                  {family.name}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {family.styles.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setSelectedStyle(style)}
                      className={`border px-2 py-0.5 font-mono text-[11px] transition-colors ${
                        selectedStyle === style
                          ? 'border-fd-foreground bg-fd-foreground text-fd-background'
                          : 'border-fd-border bg-fd-background text-fd-muted-foreground hover:border-fd-foreground/50 hover:text-fd-foreground'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 w-full min-w-0 overflow-hidden border border-fd-border bg-[#0a0a0a] p-3.5 text-neutral-200">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
            <span className="min-w-0 truncate font-mono text-white">{selectedStyle}</span>
            <button
              type="button"
              onClick={copyStyleSnippet}
              className="inline-flex shrink-0 items-center gap-1 border border-neutral-800 bg-[#111111] px-2 py-0.5 font-mono text-[10px] text-neutral-300 transition-colors hover:border-neutral-500 hover:text-white"
            >
              {copiedStyle ? (
                <>
                  <Check className="size-3 text-white" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  Copy Snippet
                </>
              )}
            </button>
          </div>
          <pre className="w-full overflow-x-auto font-mono text-[11.5px] leading-relaxed text-neutral-300">
            <code>{mapSnippet}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
