import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  turbopack: {
    root: import.meta.dirname,
  },
  async rewrites() {
    return [
      {
        source: '/docs/:path*.mdx',
        destination: '/llms.mdx/:path*',
      },
      {
        source: '/docs/:path*.md',
        destination: '/llms.mdx/:path*',
      },
      {
        source: '/docs.mdx',
        destination: '/llms.mdx',
      },
      {
        source: '/docs.md',
        destination: '/llms.mdx',
      },
    ];
  },
};

export default withMDX(config);
