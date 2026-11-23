import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SITE_VERSION } from '@/lib/site';
import { getLLMText, source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const pages = source.getPages();
  const rendered = await Promise.all(pages.map((page) => getLLMText(page)));

  const header = [
    `# ${SITE_NAME} ${SITE_VERSION} — Complete Documentation`,
    `Source: ${SITE_URL}`,
    `Summary: ${SITE_DESCRIPTION}`,
    '',
    '---',
    '',
  ].join('\n');

  return new Response(`${header}${rendered.join('\n\n---\n\n')}`, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
