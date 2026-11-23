import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { source } from '@/lib/source';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const docEntries: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${SITE_URL}${page.url}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: page.url === '/docs' ? 0.9 : 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...docEntries,
  ];
}
