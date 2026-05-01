import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Avori — Shoppable video for any storefront',
  description:
    'Upload short vertical videos, tag products, and embed a shoppable widget on your website. One snippet. Three modes. Real conversion.',
  icons: {
    icon: '/brand/logo-mark.svg',
    apple: '/brand/logo-mark.svg',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'Avori',
    description: 'Shoppable video for any storefront.',
    url: '/',
    siteName: 'Avori',
    type: 'website',
    images: [{ url: '/brand/logo-mark.svg', width: 64, height: 64, alt: 'Avori' }],
  },
  twitter: {
    card: 'summary',
    title: 'Avori',
    description: 'Shoppable video for any storefront.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          theme="light"
          toastOptions={{
            style: {
              background: 'rgb(255 255 255)',
              border: '1px solid rgb(229 231 235)',
              color: 'rgb(13 13 18)',
              boxShadow: '0 8px 24px -12px rgb(13 13 18 / 0.10)',
            },
          }}
        />
      </body>
    </html>
  );
}
