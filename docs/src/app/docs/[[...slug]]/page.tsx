import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/components/mdx';
import { PageActions } from '@/components/page-actions';
import { LANDING_FAQS, SITE_NAME, SITE_URL } from '@/lib/site';
import { source } from '@/lib/source';

interface DocsPageProps {
  params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: DocsPageProps) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const markdownUrl = slug?.length ? `/docs/${slug.join('/')}.md` : '/docs.md';
  const canonicalUrl = `${SITE_URL}${page.url}`;

  const breadcrumbItems = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
    { '@type': 'ListItem', position: 2, name: 'Docs', item: `${SITE_URL}/docs` },
    ...(slug ?? []).map((segment, index) => ({
      '@type': 'ListItem',
      position: index + 3,
      name:
        index === (slug?.length ?? 0) - 1
          ? page.data.title
          : segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      item: `${SITE_URL}/docs/${(slug ?? []).slice(0, index + 1).join('/')}`,
    })),
  ];

  const techArticleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: page.data.title,
    description: page.data.description,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    author: {
      '@type': 'Person',
      name: 'Kunal Kongkan Kashyap',
      url: 'https://github.com/kunalkcube',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    about: {
      '@type': 'SoftwareSourceCode',
      name: 'ola-map-sdk',
      programmingLanguage: 'TypeScript',
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  const isFaqPage = slug?.join('/') === 'guides/faq';
  const faqJsonLd = isFaqPage
    ? {
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
      }
    : null;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Static JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: Static JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: Static JSON-LD structured data
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <DocsTitle className="tracking-tight">{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <PageActions markdownUrl={markdownUrl} pageUrl={page.url} />
      <DocsBody>
        <MDX components={getMDXComponents()} />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata({ params }: DocsPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  const ogUrl = slug?.length ? `/og/${slug.join('/')}` : '/og';
  const canonicalUrl = `${SITE_URL}${page.url}`;

  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'article',
      title: `${page.data.title} | ${SITE_NAME}`,
      description: page.data.description,
      url: canonicalUrl,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: page.data.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${page.data.title} | ${SITE_NAME}`,
      description: page.data.description,
      images: [ogUrl],
    },
  };
}
