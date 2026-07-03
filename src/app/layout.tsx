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
  title: 'Avori | One platform. Every growth tool.',
  description:
    'The all-in-one commerce experience platform: reviews, shoppable video, AI shade analysis, quizzes, loyalty, referrals, bundles and upsells, one dashboard, one customer database, one AI layer.',
  icons: {
    icon: '/brand/logo-mark.svg',
    apple: '/brand/logo-mark.svg',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'Avori | One platform. Every growth tool.',
    description:
      'Increase sales, engage customers and build loyalty, without the chaos of multiple apps.',
    url: '/',
    siteName: 'Avori',
    type: 'website',
    images: [{ url: '/brand/logo-mark.svg', width: 64, height: 64, alt: 'Avori' }],
  },
  twitter: {
    card: 'summary',
    title: 'Avori | One platform. Every growth tool.',
    description:
      'Increase sales, engage customers and build loyalty, without the chaos of multiple apps.',
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
              border: '1px solid rgb(231 229 228)',
              color: 'rgb(17 24 39)',
              boxShadow: '0 8px 24px -12px rgb(17 24 39 / 0.10)',
            },
          }}
        />
      </body>
    </html>
  );
}
