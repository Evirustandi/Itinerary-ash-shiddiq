'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Headphones, Loader2, MapPin, ShieldCheck } from 'lucide-react';
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
      <header className="welcome-header">
        <a href="/" className="welcome-brand" aria-label="Ash-Shiddiq Tour & Travel, halaman awal"><img src="/logo.png" alt="Ash-Shiddiq Tour & Travel" /><span>Portal Jemaah<small>Perjalanan Umrah 2026</small></span></a>
        <span className="welcome-header-badge"><ShieldCheck /> Jadwal resmi jemaah</span>
      </header>
      <section className="welcome-content">
        <div className="welcome-intro">
          <p className="welcome-kicker">Selamat datang di portal perjalanan</p>
          <h1>Menuntun perjalanan<br />menuju <em>Baitullah</em><br />dengan hati teduh.</h1>
          <p className="welcome-copy">Ikuti jadwal ibadah, lokasi berkumpul, dan pembaruan dari tim Ash‑Shiddiq dalam satu tempat yang mudah dibaca.</p>
          <div className="welcome-meta"><span><CalendarDays /> 1–9 November 2026</span><span><Headphones /> Audio perjalanan tersedia</span></div>
        </div>
        <div className="welcome-journey-panel">
          <span className="welcome-panel-label"><span className="status-light" /> Perjalanan berikutnya</span>
          <h2>Grup 1 November 2026</h2>
          <p>Itinerary 9 hari bersama Ash‑Shiddiq Tour & Travel.</p>
          <div className="welcome-panel-facts"><span><CalendarDays /> 1–9 November 2026</span><span><MapPin /> Makkah & Madinah</span></div>
          <button className="welcome-cta" onClick={() => void beginJourney('1-november-2026')} disabled={Boolean(entering)}>
            {entering ? <><Loader2 className="animate-spin" /> Membuka itinerary…</> : <>Mulai perjalanan <ArrowRight /></>}
          </button>
          <p className="audio-consent">Audio dimulai setelah tombol ditekan dan dapat dimatikan kapan saja.</p>
        </div>
      </section>
      <footer className="welcome-footer"><span>Ash‑Shiddiq Tour & Travel · PT. Hasan Berkah Wisata</span><span>Informasi perjalanan untuk jemaah</span></footer>
    </main>
  );
}
