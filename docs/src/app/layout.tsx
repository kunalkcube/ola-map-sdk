import { RootProvider } from 'fumadocs-ui/provider/next';
import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import './global.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} v2.0 — TypeScript SDK for Ola Maps`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: 'Kunal Kongkan Kashyap', url: 'https://github.com/kunalkcube' }],
  creator: 'Kunal Kongkan Kashyap',
  publisher: SITE_NAME,
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  keywords: [
    'ola-map-sdk',
    'Ola Maps SDK',
    'Ola Maps API',
    'Ola Maps TypeScript',
    'Ola Maps Next.js',
    'Ola Maps React',
    'Ola Maps MapLibre',
    'Ola Maps OAuth2',
    'Ola Maps Street View',
    'Ola Maps Routing',
    'Ola Maps Geocoding',
    'Ola Maps Autocomplete',
    'Ola Maps Geofencing',
    'India Maps API SDK',
  ],
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} v2.0 — TypeScript SDK for Ola Maps`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [
      {
        url: '/og',
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} v2.0 Documentation`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} v2.0 — TypeScript SDK for Ola Maps`,
    description: SITE_DESCRIPTION,
    images: ['/og'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col font-sans antialiased selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-black">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
