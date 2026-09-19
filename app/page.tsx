'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Headphones, Loader2 } from 'lucide-react';
import { useAmbientAudio } from '@/components/ambient-audio';

export default function WelcomePage() {
  const router = useRouter();
  const { start } = useAmbientAudio();
  const [entering, setEntering] = useState('');

  async function beginJourney(slug: string) {
    if (entering) return;
    setEntering(slug);
    try {
      await start();
    } catch (error) {
      console.warn('Audio tidak dapat dimulai pada perangkat ini.', error);
    } finally {
      window.setTimeout(() => router.push(`/itinerary/${slug}`), 420);
    }
  }

  return (
    <main className={`welcome-page ${entering ? 'is-entering' : ''}`}>
      <div className="welcome-backdrop" aria-hidden="true" />
      <section className="welcome-content">
        <img className="welcome-logo" src="/logo.png" alt="Ash-Shiddiq Tour & Travel" />
        <p className="welcome-kicker">Itinerary Umrah Ash‑Shiddiq 2026</p>
        <h1>Menuju Baitullah,<br />dengan hati yang tenang.</h1>
        <p className="welcome-copy">Satu tempat untuk mengikuti seluruh perjalanan, jadwal ibadah, dan pembaruan dari tim pendamping.</p>
        <div className="journey-options">
          <button className="journey-option" onClick={() => void beginJourney('27-september-2026')} disabled={Boolean(entering)}>
            <span><CalendarDays /> Grup 27 September</span><strong>27 Sep—9 Okt 2026</strong><small>{entering === '27-september-2026' ? <><Loader2 className="animate-spin" /> Membuka…</> : <>Lihat itinerary <ArrowRight /></>}</small>
          </button>
          <button className="journey-option indigo" onClick={() => void beginJourney('29-september-2026')} disabled={Boolean(entering)}>
            <span><CalendarDays /> Grup 29 September</span><strong>29 Sep—12 Okt 2026</strong><small>{entering === '29-september-2026' ? <><Loader2 className="animate-spin" /> Membuka…</> : <>Lihat itinerary <ArrowRight /></>}</small>
          </button>
        </div>
        <div className="welcome-meta"><span><Headphones /> Audio lembut tersedia</span></div>
        <p className="audio-consent">Audio dimulai setelah tombol ditekan dan dapat dimatikan kapan saja.</p>
      </section>
      <p className="welcome-footnote">Ash‑Shiddiq Tour & Travel · PT. Hasan Berkah Wisata</p>
    </main>
  );
}
