import { GITHUB_URL, NPM_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, SITE_VERSION } from '@/lib/site';
import { source } from '@/lib/source';

export const revalidate = false;

export async function GET() {
  const pages = source.getPages();

  const sections: Record<string, typeof pages> = {
    'Getting Started': [],
    'Frameworks & Maps': [],
    'API Reference': [],
    'Production Guides': [],
  };

  for (const page of pages) {
    if (page.url.startsWith('/docs/frameworks')) {
      sections['Frameworks & Maps'].push(page);
    } else if (page.url.startsWith('/docs/api')) {
      sections['API Reference'].push(page);
    } else if (page.url.startsWith('/docs/guides')) {
      sections['Production Guides'].push(page);
    } else {
      sections['Getting Started'].push(page);
    }
  }

  const lines: string[] = [
    `# ${SITE_NAME} (${SITE_VERSION})`,
    '',
    `> ${SITE_DESCRIPTION}`,
    '',
    `- Full single-file docs for LLMs: ${SITE_URL}/llms-full.txt`,
    `- GitHub Repository: ${GITHUB_URL}`,
    `- npm Package: ${NPM_URL}`,
    `- Append \`.md\` to any documentation URL (e.g. \`${SITE_URL}/docs/api/places.md\`) for clean Markdown.`,
    '',
  ];

  for (const [heading, items] of Object.entries(sections)) {
    if (items.length === 0) continue;
    lines.push(`## ${heading}`);
    lines.push('');
    for (const page of items) {
      const mdUrl = page.url === '/docs' ? `${SITE_URL}/docs.md` : `${SITE_URL}${page.url}.md`;
      const desc = page.data.description ? `: ${page.data.description}` : '';
      lines.push(`- [${page.data.title}](${mdUrl})${desc}`);
    }
    lines.push('');
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
