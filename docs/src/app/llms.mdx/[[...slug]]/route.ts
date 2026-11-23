import { notFound } from 'next/navigation';
import { getLLMText, source } from '@/lib/source';

export const revalidate = false;

export async function GET(
  _req: Request,
  context: { params: Promise<{ slug?: string[] }> },
) {
  const { slug } = await context.params;
  const page = source.getPage(slug);
  if (!page) notFound();

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}

export function generateStaticParams() {
  return source.generateParams();
}
