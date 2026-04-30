import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Avori — Shoppable video for any storefront',
  description:
    'Upload short vertical videos, tag products, and embed a shoppable widget on your website.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
