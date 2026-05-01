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
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgb(18 26 47)',
              border: '1px solid rgb(30 41 70)',
              color: 'rgb(248 250 252)',
            },
          }}
        />
      </body>
    </html>
  );
}
