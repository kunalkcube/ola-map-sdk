import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { GITHUB_URL, SITE_NAME, SITE_VERSION } from './site';

export function BrandLogo() {
  return (
    <span className="inline-flex items-center gap-2 font-semibold tracking-tight text-fd-foreground">
      <img
        src="/logo.png"
        alt={SITE_NAME}
        width={22}
        height={22}
        className="size-[22px] shrink-0 object-contain dark:invert"
      />
      <span className="text-[15px] leading-none">{SITE_NAME}</span>
      <span className="border border-fd-border px-1.5 py-0.5 font-mono text-[10px] font-medium text-fd-muted-foreground">
        {SITE_VERSION}
      </span>
    </span>
  );
}

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <BrandLogo />,
      transparentMode: 'top',
    },
    githubUrl: GITHUB_URL,
    links: [
      {
        text: 'Docs',
        url: '/docs',
        active: 'nested-url',
      },
      {
        text: 'API Reference',
        url: '/docs/api',
        active: 'nested-url',
      },
      {
        text: 'Frameworks',
        url: '/docs/frameworks/nextjs',
        active: 'nested-url',
      },
      {
        text: 'llms.txt',
        url: '/llms.txt',
      },
    ],
  };
}
