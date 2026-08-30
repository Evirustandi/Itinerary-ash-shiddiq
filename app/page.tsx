'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Headphones, Loader2 } from 'lucide-react';
import { useAmbientAudio } from '@/components/ambient-audio';

export default function WelcomePage() {
  const router = useRouter();
  const { start } = useAmbientAudio();
  const [entering, setEntering] = useState(false);

  async function beginJourney() {
    if (entering) return;
    setEntering(true);
    try {
      await start();
    } catch (error) {
      console.warn('Audio tidak dapat dimulai pada perangkat ini.', error);
    } finally {
      window.setTimeout(() => router.push('/itinerary'), 420);
    }
  }

  return (
    <main className={`welcome-page ${entering ? 'is-entering' : ''}`}>
      <div className="welcome-backdrop" aria-hidden="true" />
      <section className="welcome-content">
        <img className="welcome-logo" src="/logo.png" alt="Ash-Shiddiq Tour & Travel" />
        <p className="welcome-kicker">Umrah 12 Hari · 27 September 2026</p>
        <h1>Menuju Baitullah,<br />dengan hati yang tenang.</h1>
        <p className="welcome-copy">Satu tempat untuk mengikuti seluruh perjalanan, jadwal ibadah, dan pembaruan dari tim pendamping.</p>
        <div className="welcome-meta">
          <span><CalendarDays /> 27 Sep—9 Okt 2026</span>
          <span><Headphones /> Audio lembut tersedia</span>
        </div>
        <button className="welcome-cta" onClick={() => void beginJourney()} disabled={entering}>
          {entering ? <><Loader2 className="animate-spin" /> Membuka itinerary…</> : <>Mulai perjalanan <ArrowRight /></>}
        </button>
        <p className="audio-consent">Audio dimulai setelah tombol ditekan dan dapat dimatikan kapan saja.</p>
      </section>
      <p className="welcome-footnote">Ash‑Shiddiq Tour & Travel · PT. Hasan Berkah Wisata</p>
    </main>
  );
}
