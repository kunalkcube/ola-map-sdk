import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { CoordinatePlayground } from '@/components/coordinate-playground';
import { HeroCodeTabs } from '@/components/hero-code-tabs';
import { InstallCommand } from '@/components/install-command';
import { baseOptions } from '@/lib/layout.shared';
import {
  GITHUB_URL,
  ISSUES_URL,
  LANDING_FAQS,
  NPM_URL,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SITE_VERSION,
} from '@/lib/site';

const API_MODULES = [
  {
    title: 'Places & Geocoding',
    count: '10 methods',
    href: '/docs/api/places',
    summary:
      'Autocomplete, geocode, reverse geocode, place details, nearby search (with layers and limit caps), text search, validation, and photos.',
    methods: ['autocomplete()', 'reverseGeocode()', 'nearbySearch()'],
  },
  {
    title: 'Routing & Fleet',
    count: '6 methods',
    href: '/docs/api/routing',
    summary:
      'Turn-by-turn directions with traffic metadata, many-to-many distance matrices, 25-stop TSP route optimizer, and Edge-safe fleet planner.',
    methods: ['getDirections()', 'getDistanceMatrix()', 'fleetPlanner()'],
  },
  {
    title: 'Roads & Telemetry',
    count: '3 methods',
    href: '/docs/api/roads',
    summary:
      'Snap GPS traces to roads (up to 50 points), query nearest road segments (up to 100 points), and look up speed limits.',
    methods: ['snapToRoad()', 'nearestRoads()', 'speedLimits()'],
  },
  {
    title: 'Street View',
    count: '3 methods',
    href: '/docs/api/street-view',
    summary:
      'Query street-level imagery coverage bounding boxes, fetch nearest panorama imageId, and inspect bearings and neighbor links.',
    methods: ['getCoverage()', 'getImageId()', 'getMetadata()'],
  },
  {
    title: 'Geofencing',
    count: '6 methods',
    href: '/docs/api/geofencing',
    summary:
      'CRUD operations for circular and polygonal geofences plus point-in-geofence containment status checks.',
    methods: ['create()', 'list()', 'checkStatus()'],
  },
  {
    title: 'Elevation',
    count: '2 methods',
    href: '/docs/api/elevation',
    summary:
      'Retrieve terrain altitude in meters for single coordinates or batches of up to 25 locations per request.',
    methods: ['getElevation()', 'getMultiElevation()'],
  },
  {
    title: 'Tiles & Static Maps',
    count: '10 methods',
    href: '/docs/api/tiles',
    summary:
      'Vector PBF tiles, raster PNG/JPG tiles, SDF font glyphs, style specs, 3D tilesets, and static map images (Center, BBox, Auto).',
    methods: ['getRasterTile()', 'getStaticMapAuto()', 'get3DTileset()'],
  },
  {
    title: 'OAuth 2.0 & Auth',
    count: '4 modes',
    href: '/docs/authentication',
    summary:
      'API key, server-side OAuth 2.0 client_credentials with single-flight proactive refresh, Bearer token providers, and Proxy Mode.',
    methods: ['getAccessToken()', 'redactUrl()', 'OlaRateLimitError'],
  },
] as const;

const SUBPATH_EXPORTS = [
  {
    pkg: 'ola-map-sdk/next',
    title: 'Next.js App Router Proxy',
    href: '/docs/frameworks/nextjs',
    description:
      'Catch-all route handler that keeps API keys and OAuth secrets on the server, strips client credentials, blocks path traversal, and streams JSON and binary tiles.',
    bullets: [
      'Prefix allowlist for Ola Maps APIs',
      'Optional authorize(request) guard',
      'Next.js 15/16 async params and Cache-Control',
    ],
  },
  {
    pkg: 'ola-map-sdk/react',
    title: 'React 18+ Hooks',
    href: '/docs/frameworks/react',
    description:
      'Client hooks with a "use client" directive: <OlaMapsProvider>, debounced useOlaAutocomplete, useOlaDirections, and useOlaReverseGeocode.',
    bullets: [
      'AbortController cleanup on unmount',
      'Built-in keystroke debounce (default 250ms)',
      'Works with Proxy Mode',
    ],
  },
  {
    pkg: 'ola-map-sdk/maplibre',
    title: 'MapLibre GL Integration',
    href: '/docs/frameworks/maplibre',
    description:
      'Strict *.olamaps.io URL verification prevents leaking credentials to third-party layers, sprites, or fonts, alongside 27 typed map styles.',
    bullets: [
      'Parses every URL with new URL()',
      'Rewrites app.olamaps.io to api.olamaps.io',
      'Built-in proxyBaseUrl support',
    ],
  },
] as const;

export default function HomePage() {
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'ola-map-sdk',
    alternateName: SITE_NAME,
    version: '2.0.0',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    codeRepository: GITHUB_URL,
    programmingLanguage: ['TypeScript', 'JavaScript'],
    runtimePlatform: [
      'Node.js 18+',
      'Browser',
      'Next.js',
      'React',
      'Cloudflare Workers',
      'Bun',
      'Deno',
    ],
    license: 'https://opensource.org/licenses/MIT',
    author: {
      '@type': 'Person',
      name: 'Kunal Kongkan Kashyap',
      url: 'https://github.com/kunalkcube',
    },
  };

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <HomeLayout {...baseOptions()}>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Static JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Static JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Static JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <main className="w-full flex-1 overflow-x-clip">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-fd-border">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-10%,rgba(115,115,115,0.16),rgba(163,163,163,0.06)_40%,transparent_65%)] dark:bg-[radial-gradient(ellipse_75%_55%_at_50%_-10%,rgba(255,255,255,0.16),rgba(163,163,163,0.06)_40%,transparent_65%)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-12">
              <div className="flex min-w-0 flex-col items-start">
                <Link
                  href="/docs/migration-v2"
                  className="mb-6 inline-flex items-center gap-2 border border-fd-border bg-fd-muted px-2.5 py-1 font-mono text-xs text-fd-foreground transition-colors hover:border-fd-foreground"
                >
                  <span>{SITE_VERSION}</span>
                  <span className="text-fd-muted-foreground">/</span>
                  <span className="text-fd-muted-foreground">Migration Guide</span>
                  <ArrowRight className="size-3" />
                </Link>

                <h1 className="text-4xl font-bold tracking-tight text-fd-foreground sm:text-5xl lg:leading-[1.08]">
                  TypeScript SDK for Ola Maps.
                </h1>

                <p className="mt-5 max-w-xl text-base leading-relaxed text-fd-muted-foreground">
                  Zero-dependency client for the{' '}
                  <strong className="font-medium text-fd-foreground">Ola Maps API</strong>. Covers
                  Places, Routing, Roads, Street View, Geofencing, Elevation, and Tiles, with
                  subpath adapters for{' '}
                  <strong className="font-medium text-fd-foreground">
                    Next.js, React, and MapLibre GL
                  </strong>
                  .
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    href="/docs"
                    className="inline-flex items-center gap-2 border border-fd-foreground bg-fd-foreground px-5 py-2.5 text-sm font-medium text-fd-background transition-colors hover:bg-fd-foreground/85"
                  >
                    Documentation
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/docs/api"
                    className="inline-flex items-center gap-2 border border-fd-border bg-fd-background px-5 py-2.5 text-sm font-medium text-fd-foreground transition-colors hover:border-fd-foreground hover:bg-fd-muted"
                  >
                    API Reference
                  </Link>
                  <Link
                    href="/llms.txt"
                    className="inline-flex items-center gap-1 border border-fd-border bg-fd-background px-3.5 py-2.5 font-mono text-xs text-fd-muted-foreground transition-colors hover:border-fd-foreground hover:text-fd-foreground"
                  >
                    llms.txt
                  </Link>
                </div>

                <div className="mt-7 w-full min-w-0">
                  <InstallCommand />
                </div>
              </div>

              <div className="w-full min-w-0">
                <HeroCodeTabs />
              </div>
            </div>
          </div>
        </section>

        {/* Key Specs */}
        <section className="border-b border-fd-border bg-fd-muted/40">
          <div className="mx-auto grid max-w-6xl grid-cols-2 divide-x divide-y divide-fd-border sm:grid-cols-4 sm:divide-y-0">
            {[
              { value: '0', label: 'Runtime Dependencies', sub: 'Web fetch & Crypto only' },
              { value: '40+', label: 'Typed Methods', sub: '7 modules + OAuth 2.0' },
              { value: '4', label: 'Subpath Exports', sub: 'Core · Next · React · MapLibre' },
              { value: 'Node 18+', label: 'Standard Web APIs', sub: 'Browser · Edge · Bun · Deno' },
            ].map((stat) => (
              <div key={stat.label} className="min-w-0 px-4 py-5 sm:px-6">
                <div className="font-mono text-2xl font-semibold tracking-tight text-fd-foreground">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-medium text-fd-foreground">{stat.label}</div>
                <div className="mt-0.5 font-mono text-[11px] text-fd-muted-foreground">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* API Modules */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-fd-foreground sm:text-3xl">
                API Modules
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground sm:text-base">
                Local coordinate and limit validation before requests fire, exponential backoff on
                429/5xx responses, and automatic credential redaction in errors.
              </p>
            </div>
            <Link
              href="/docs/api"
              className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
            >
              Full endpoint matrix
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid border-l border-t border-fd-border sm:grid-cols-2 lg:grid-cols-4">
            {API_MODULES.map((mod) => (
              <Link
                key={mod.title}
                href={mod.href}
                className="group flex min-w-0 flex-col justify-between border-b border-r border-fd-border bg-fd-background p-5 transition-colors hover:bg-fd-muted/60"
              >
                <div>
                  <div className="mb-3 flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-fd-foreground">{mod.title}</h3>
                    <span className="shrink-0 font-mono text-[10px] text-fd-muted-foreground">
                      {mod.count}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-fd-muted-foreground">{mod.summary}</p>
                </div>

                <div className="mt-5 flex flex-wrap gap-1 border-t border-fd-border pt-3">
                  {mod.methods.map((method) => (
                    <code
                      key={method}
                      className="border border-fd-border bg-fd-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-fd-foreground"
                    >
                      {method}
                    </code>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Framework Subpath Exports */}
        <section className="border-y border-fd-border bg-fd-muted/30 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold tracking-tight text-fd-foreground sm:text-3xl">
                  Framework Adapters
                </h2>
                <p className="mt-2 text-sm text-fd-muted-foreground sm:text-base">
                  Separate subpath exports with optional peer dependencies so you only bundle what
                  you import.
                </p>
              </div>
              <Link
                href="/docs/installation#optional-peer-dependencies"
                className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                Peer dependencies
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid divide-y divide-fd-border border border-fd-border bg-fd-background lg:grid-cols-3 lg:divide-x lg:divide-y-0">
              {SUBPATH_EXPORTS.map((item) => (
                <Link
                  key={item.pkg}
                  href={item.href}
                  className="group flex min-w-0 flex-col justify-between p-6 transition-colors hover:bg-fd-muted/50"
                >
                  <div>
                    <div className="mb-4 flex items-center justify-between gap-2">
                      <code className="border border-fd-border bg-fd-muted px-2 py-0.5 font-mono text-xs font-medium text-fd-foreground">
                        {item.pkg}
                      </code>
                      <ArrowUpRight className="size-4 shrink-0 text-fd-muted-foreground transition-colors group-hover:text-fd-foreground" />
                    </div>
                    <h3 className="text-base font-semibold text-fd-foreground">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                  <ul className="mt-5 space-y-1.5 border-t border-fd-border pt-4 text-xs text-fd-muted-foreground">
                    {item.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span className="select-none font-mono text-fd-foreground">-</span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Coordinate & Style Explorer */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-fd-foreground sm:text-3xl">
              Coordinate Normalizer &amp; Map Styles
            </h2>
            <p className="mt-2 text-sm text-fd-muted-foreground sm:text-base">
              Check how v2.0 normalizes coordinate inputs or select one of the 27 typed MapLibre
              styles to generate a proxy-mode snippet.
            </p>
          </div>

          <CoordinatePlayground />
        </section>

        {/* Transport, Errors & Machine-Readable Docs */}
        <section className="border-t border-fd-border bg-fd-muted/30 py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="grid divide-y divide-fd-border border border-fd-border bg-fd-background md:grid-cols-3 md:divide-x md:divide-y-0">
              <div className="min-w-0 p-6">
                <div className="font-mono text-[11px] uppercase tracking-wider text-fd-muted-foreground">
                  01 / Transport
                </div>
                <h3 className="mt-2 text-base font-semibold text-fd-foreground">
                  Retries, Cache &amp; Deduplication
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                  In-flight <code className="font-mono text-xs text-fd-foreground">GET</code>{' '}
                  deduplication, opt-in LRU + TTL caching, exponential backoff with jitter, and{' '}
                  <code className="font-mono text-xs text-fd-foreground">Retry-After</code>{' '}
                  handling.
                </p>
              </div>
              <div className="min-w-0 p-6">
                <div className="font-mono text-[11px] uppercase tracking-wider text-fd-muted-foreground">
                  02 / Errors
                </div>
                <h3 className="mt-2 text-base font-semibold text-fd-foreground">
                  Typed &amp; Redacted Hierarchy
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                  Catch{' '}
                  <code className="font-mono text-xs text-fd-foreground">OlaRateLimitError</code>,{' '}
                  <code className="font-mono text-xs text-fd-foreground">OlaAuthError</code>, or{' '}
                  <code className="font-mono text-xs text-fd-foreground">OlaValidationError</code>{' '}
                  with automatic credential redaction and zero{' '}
                  <code className="font-mono text-xs text-fd-foreground">console.error</code>{' '}
                  output.
                </p>
              </div>
              <div className="min-w-0 p-6">
                <div className="font-mono text-[11px] uppercase tracking-wider text-fd-muted-foreground">
                  03 / Plaintext Docs
                </div>
                <h3 className="mt-2 text-base font-semibold text-fd-foreground">
                  Markdown &amp; llms.txt
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">
                  Fetch{' '}
                  <Link href="/llms.txt" className="font-mono text-xs text-fd-foreground underline">
                    /llms.txt
                  </Link>{' '}
                  or{' '}
                  <Link
                    href="/llms-full.txt"
                    className="font-mono text-xs text-fd-foreground underline"
                  >
                    /llms-full.txt
                  </Link>
                  , or append <code className="font-mono text-xs text-fd-foreground">.md</code> to
                  any docs URL for raw Markdown.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <h2 className="text-2xl font-bold tracking-tight text-fd-foreground sm:text-3xl">
              FAQ
            </h2>
            <Link
              href="/docs/guides/faq"
              className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-fd-muted-foreground transition-colors hover:text-fd-foreground"
            >
              All questions
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-fd-border border border-fd-border bg-fd-background">
            {LANDING_FAQS.map((faq) => (
              <details key={faq.question} className="group p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-fd-foreground sm:text-base">
                  <span>{faq.question}</span>
                  <span className="font-mono text-base text-fd-muted-foreground transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-fd-muted-foreground">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-fd-border bg-fd-background">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt={SITE_NAME}
                width={20}
                height={20}
                className="size-5 shrink-0 object-contain dark:invert"
              />
              <div>
                <div className="text-sm font-semibold text-fd-foreground">
                  {SITE_NAME}{' '}
                  <span className="font-mono text-xs font-normal text-fd-muted-foreground">
                    {SITE_VERSION}
                  </span>
                </div>
                <p className="text-xs text-fd-muted-foreground">
                  MIT License · Kunal Kongkan Kashyap
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-fd-muted-foreground">
              <Link href="/docs" className="hover:text-fd-foreground">
                Docs
              </Link>
              <Link href="/docs/api" className="hover:text-fd-foreground">
                API Reference
              </Link>
              <Link href="/docs/migration-v2" className="hover:text-fd-foreground">
                v2 Migration
              </Link>
              <Link href="/llms.txt" className="font-mono hover:text-fd-foreground">
                llms.txt
              </Link>
              <Link href="/llms-full.txt" className="font-mono hover:text-fd-foreground">
                llms-full.txt
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:text-fd-foreground"
              >
                GitHub
              </a>
              <a
                href={NPM_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:text-fd-foreground"
              >
                npm
              </a>
              <a
                href={ISSUES_URL}
                target="_blank"
                rel="noreferrer"
                className="hover:text-fd-foreground"
              >
                Issues
              </a>
            </div>
          </div>
        </footer>
      </main>
    </HomeLayout>
  );
}
