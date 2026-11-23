import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { SITE_DESCRIPTION, SITE_NAME, SITE_VERSION } from '@/lib/site';
import { source } from '@/lib/source';

export const runtime = 'nodejs';

async function getLogoDataUrl(): Promise<string | null> {
  try {
    const buf = await readFile(join(process.cwd(), 'public', 'logo.png'));
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await context.params;
  const page = slug && slug.length > 0 ? source.getPage(slug) : undefined;
  const logoSrc = await getLogoDataUrl();

  const title = page?.data.title ?? 'TypeScript SDK for Ola Maps.';
  const description = page?.data.description ?? SITE_DESCRIPTION;
  const sectionLabel = page
    ? page.url.replace(/^\/docs\/?/, '').split('/')[0]?.toUpperCase() || 'DOCUMENTATION'
    : 'TYPESCRIPT SDK';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#000000',
          color: '#fafafa',
          padding: '64px 72px',
          border: '1px solid #262626',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {logoSrc && (
              <div
                style={{
                  width: 44,
                  height: 44,
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 6,
                }}
              >
                <img src={logoSrc} width={32} height={32} alt={SITE_NAME} />
              </div>
            )}
            <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
              {SITE_NAME}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                padding: '4px 10px',
                border: '1px solid #404040',
                color: '#d4d4d4',
              }}
            >
              {SITE_VERSION}
            </span>
          </div>
          <span
            style={{
              fontSize: 15,
              color: '#a3a3a3',
              letterSpacing: '0.1em',
            }}
          >
            {sectionLabel}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 980 }}>
          <div
            style={{
              fontSize: title.length > 34 ? 54 : 66,
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: '-0.03em',
              color: '#ffffff',
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.45,
              color: '#a3a3a3',
            }}
          >
            {description.length > 155 ? `${description.slice(0, 152)}...` : description}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #262626',
            paddingTop: 24,
            fontSize: 18,
            color: '#a3a3a3',
          }}
        >
          <span>Places · Routing · Roads · Street View · Geofencing · Elevation · Tiles</span>
          <span style={{ color: '#ffffff' }}>ola-map-sdk.vercel.app</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
