import { docs } from 'fumadocs-mdx:collections/server';
import { type InferPageType, loader } from 'fumadocs-core/source';

export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
});

export type DocsPage = InferPageType<typeof source>;

export async function getLLMText(page: DocsPage): Promise<string> {
  const processed = await page.data.getText('processed');
  return [
    `# ${page.data.title}`,
    `URL: ${page.url}`,
    page.data.description ? `Description: ${page.data.description}` : '',
    '',
    processed.trim(),
  ]
    .filter((line, index) => index >= 3 || line.length > 0)
    .join('\n');
}
