'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen, CalendarDays, MapPin, MessageCircle, Plane, Search, ShieldCheck } from 'lucide-react';
import { useAmbientAudio } from '@/components/ambient-audio';
import { PrayerTimes } from '@/components/prayer-times';
import { itinerary1NovemberSeed } from '@/lib/itinerary-data';

export default function WelcomePage() {
  const router = useRouter();
  const { start } = useAmbientAudio();
  const [entering, setEntering] = useState('');
  const [groupQuery, setGroupQuery] = useState('');
  const trip = itinerary1NovemberSeed;
  // Only published-to-the-portal groups belong here; older hidden groups stay accessible by direct URL.
  const visibleTrips = [trip];
  const normalizedQuery = groupQuery.trim().toLocaleLowerCase('id-ID');
  const matchingTrips = visibleTrips.filter((item) =>
    [item.tripName, item.dateRange, item.departureLabel, item.tripSlug, 'november 2026']
      .some((value) => value.toLocaleLowerCase('id-ID').includes(normalizedQuery))
  );

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
        </div>
        <div className="welcome-journey-panel">
          <span className="welcome-panel-label"><span className="status-light" /> Jadwal tersedia untuk jemaah</span>
          <h2>Temukan perjalanan Anda</h2>
          <p>Lihat rombongan yang tersedia, lalu pilih jadwal perjalanan Anda.</p>
          <div className="welcome-panel-facts"><span><CalendarDays /> {visibleTrips.length} rombongan tersedia</span><span><MapPin /> Makkah & Madinah</span></div>
          <a className="welcome-cta" href="#rombongan">Menuju itinerary <ArrowRight /></a>
          <p className="audio-consent">Pilih rombongan di bawah untuk membuka itinerary. Audio dimulai setelah itinerary dibuka dan dapat dimatikan kapan saja.</p>
        </div>
      </section>
      <section className="portal-body" aria-label="Informasi portal jemaah">
        <PrayerTimes />
        <div id="rombongan" className="portal-section-title"><div><p className="eyebrow">Rombongan keberangkatan</p><h2>Perjalanan yang akan datang</h2><p>Temukan rombongan Anda untuk membuka jadwal perjalanan.</p></div><span>{visibleTrips.length} grup tersedia</span></div>
        <label className="group-search"><span>Cari rombongan atau tanggal keberangkatan</span><span className="group-search-input"><Search aria-hidden="true" /><input type="search" value={groupQuery} onChange={(event) => setGroupQuery(event.target.value)} placeholder="Contoh: 1 November 2026" /></span></label>
        <p className="group-result-count" role="status">{matchingTrips.length} rombongan ditemukan</p>
        {matchingTrips.map((item) => <article className="portal-trip-card" key={item.tripSlug}>
          <div className="portal-trip-image"><span>{item.departureLabel}</span><h3>Menuju tanah suci bersama Ash‑Shiddiq.</h3></div>
          <div className="portal-trip-details"><p className="eyebrow">Umrah {item.days.length} hari</p><h3>{item.tripName}</h3><div className="portal-trip-facts"><span><CalendarDays /> {item.dateRange}</span><span><Plane /> {item.flights[0]?.route}</span><span><MapPin /> Makkah · Madinah</span></div><p>Ikuti hari demi hari, dari keberangkatan hingga kembali ke Jakarta.</p><button onClick={() => void beginJourney(item.tripSlug)} disabled={Boolean(entering)}>Buka rincian itinerary <ArrowRight /></button></div>
        </article>)}
        {matchingTrips.length === 0 && <div className="group-empty"><Search /><h3>Rombongan tidak ditemukan</h3><p>Periksa nama grup atau tanggal keberangkatan, lalu coba lagi.</p><button type="button" onClick={() => setGroupQuery('')}>Tampilkan semua rombongan</button></div>}
        <div className="portal-benefits">
          <article><span><MessageCircle /></span><div><small>PENDAMPING PERJALANAN</small><h3>Kontak yang mudah dihubungi</h3><p>Hubungi Tour Leader atau Muthawwif melalui nomor yang tersedia di itinerary.</p></div></article>
          <article><span><BookOpen /></span><div><small>JADWAL TERPERINCI</small><h3>Agenda setiap hari</h3><p>Lihat waktu kegiatan, lokasi, dan catatan perubahan.</p></div></article>
          <article><span><ShieldCheck /></span><div><small>INFORMASI TERBARU</small><h3>Pembaruan dari pengelola</h3><p>Perubahan jadwal tampil otomatis pada itinerary.</p></div></article>
        </div>
        <div className="portal-quote"><p className="eyebrow">Doa perjalanan</p><blockquote>“Labbaik Allahumma Labbaik.”</blockquote><span>Semoga setiap langkah menjadi perjalanan yang penuh berkah.</span></div>
      </section>
      <footer className="welcome-footer"><span>Ash‑Shiddiq Tour & Travel · PT. Hasan Berkah Wisata</span><span>Informasi perjalanan untuk jemaah</span></footer>
    </main>
  );
}
