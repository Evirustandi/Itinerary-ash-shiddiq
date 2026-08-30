import type { Metadata } from 'next';
import './globals.css';

const siteOrigin = process.env.SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title: 'Itinerary Umrah 2026 | Ash‑Shiddiq',
  description: 'Jadwal perjalanan umrah Ash‑Shiddiq 27 September–9 Oktober 2026 yang selalu diperbarui.',
  openGraph: {
    title: 'Itinerary Umrah 2026 | Ash‑Shiddiq',
    description: 'Jadwal perjalanan umrah 27 September–9 Oktober 2026 yang selalu diperbarui.',
    type: 'website',
    locale: 'id_ID',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Itinerary Umrah 2026 Ash-Shiddiq Tour & Travel' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Itinerary Umrah 2026 | Ash‑Shiddiq',
    description: 'Jadwal perjalanan umrah 27 September–9 Oktober 2026 yang selalu diperbarui.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
