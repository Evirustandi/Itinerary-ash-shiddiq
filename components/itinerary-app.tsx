'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, ChevronDown, Clock3,
  ExternalLink, MapPin, Plane, Radio, RefreshCw, Search, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EventStatus, ItineraryDay, ItineraryPayload } from '@/lib/itinerary-data';

const departure = new Date('2026-09-27T13:00:00+07:00');
const tripEnd = new Date('2026-10-09T23:59:59+03:00');

const statusLabel: Record<EventStatus, string> = {
  scheduled: 'Terjadwal',
  now: 'Berlangsung',
  done: 'Selesai',
  changed: 'Berubah',
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(`${date}T12:00:00`));
}

function findFocusDay(days: ItineraryDay[]) {
  const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return days.find((day) => day.date === today) ?? (new Date() < departure ? days[0] : days.at(-1));
}

export function ItineraryApp({ initialData }: { initialData: ItineraryPayload }) {
  const [data, setData] = useState(initialData);
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('Semua');
  const [refreshing, setRefreshing] = useState(false);
  const [liveMessage, setLiveMessage] = useState('');

  const refresh = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const response = await fetch('/api/itinerary', { cache: 'no-store' });
      if (!response.ok) throw new Error('Gagal memuat');
      const latest = await response.json() as ItineraryPayload;
      setData((current) => {
        if (current.updatedAt !== latest.updatedAt) setLiveMessage('Ada pembaruan baru dari tim Ash‑Shiddiq.');
        return latest;
      });
    } catch {
      if (manual) setLiveMessage('Jadwal tersimpan masih tampil. Coba segarkan kembali.');
    } finally {
      if (manual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 20_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const focusDay = useMemo(() => findFocusDay(data.days), [data.days]);
  const daysToGo = Math.max(0, Math.ceil((departure.getTime() - Date.now()) / 86_400_000));
  const phase = new Date() < departure ? 'Agenda keberangkatan' : new Date() > tripEnd ? 'Perjalanan selesai' : 'Agenda hari ini';
  const cities = ['Semua', ...Array.from(new Set(data.days.map((day) => day.city)))];

  const filteredDays = data.days.filter((day) => {
    const haystack = [day.title, day.city, day.weekday, ...day.events.flatMap((event) => [event.title, event.details, event.location])]
      .join(' ').toLowerCase();
    return (city === 'Semua' || day.city === city) && haystack.includes(query.trim().toLowerCase());
  });

  const updatedLabel = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
  }).format(new Date(data.updatedAt));

  return (
    <main className="min-h-screen">
      <header className="site-header">
        <a href="/" className="brand-lockup" aria-label="Kembali ke halaman awal Ash-Shiddiq Tour & Travel">
          <img className="site-logo" src="/logo.png" alt="Ash-Shiddiq Tour & Travel" />
        </a>
        <div className="header-actions">
          <span className="live-pill"><Radio /> Live itinerary</span>
          <Button variant="outline" size="sm" onClick={() => void refresh(true)} disabled={refreshing} aria-label="Segarkan jadwal">
            <RefreshCw className={refreshing ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Segarkan</span>
          </Button>
        </div>
      </header>

      <div id="atas" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <section className="hero-grid">
          <div className="hero-panel">
            <p className="eyebrow">{data.tripName} · {data.dateRange}</p>
            <h1>Perjalanan suci,<br />selangkah lebih tenang.</h1>
            <p className="hero-copy">Jadwal terbaru untuk jemaah Ash‑Shiddiq, lengkap dengan waktu berkumpul, agenda, lokasi, dan perubahan dari tim pendamping.</p>
            <div className="countdown-card">
              <div>
                <p className="mini-label">Keberangkatan</p>
                <p className="departure-date">Ahad, 27 September 2026</p>
              </div>
              <div className="countdown-number">{daysToGo}<small>{daysToGo === 1 ? 'hari lagi' : 'hari lagi'}</small></div>
            </div>
          </div>

          {focusDay && (
            <div className="today-card">
              <div className="today-heading">
                <div><p className="mini-label text-[#d8c48e]">{phase}</p><h2>{focusDay.title}</h2></div>
                <span className="day-badge">Hari {focusDay.dayNumber}</span>
              </div>
              <div className="today-meta">
                <div className="info-chip"><CalendarDays /> {formatDate(focusDay.date)}</div>
                <div className="info-chip"><MapPin /> {focusDay.city}</div>
              </div>
              <div className="timeline-preview">
                {focusDay.events.slice(0, 4).map((event) => (
                  <div key={event.id}><time>{event.time}</time><span>{event.title}</span></div>
                ))}
              </div>
              <a href={`#hari-${focusDay.dayNumber}`} className="primary-link">Lihat agenda lengkap <ArrowRight /></a>
              <p className="updated"><Clock3 /> Terakhir diperbarui {updatedLabel} WIB</p>
            </div>
          )}
        </section>

        <section className="notice-card" aria-label="Pengumuman perjalanan">
          <span className="notice-icon"><Sparkles /></span>
          <div><p>Info untuk jemaah</p><strong>{data.notice}</strong></div>
        </section>

        <section id="jadwal" className="schedule-section">
          <div className="section-heading">
            <div><p className="eyebrow">Itinerary lengkap</p><h2>Jadwal perjalanan</h2><p>Ketuk setiap hari untuk melihat rincian. {data.timezoneNote}</p></div>
            <span>{filteredDays.length} hari ditampilkan</span>
          </div>

          <div className="schedule-controls">
            <label className="search-field"><Search /><span className="sr-only">Cari agenda</span><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari kegiatan atau lokasi…" /></label>
            <div className="city-filters" aria-label="Filter kota">
              {cities.map((option) => <button key={option} className={city === option ? 'active' : ''} onClick={() => setCity(option)}>{option}</button>)}
            </div>
          </div>

          <div className="day-list">
            {filteredDays.map((day) => (
              <details key={day.dayNumber} id={`hari-${day.dayNumber}`} className="day-card" open={day.dayNumber === focusDay?.dayNumber}>
                <summary>
                  <span className="date-block"><b>{String(day.dayNumber).padStart(2, '0')}</b><small>Hari</small></span>
                  <span className="day-title"><small>{day.weekday} · {formatDate(day.date)} · {day.city}</small><strong>{day.title}</strong></span>
                  <span className="event-count">{day.events.length} agenda</span>
                  <ChevronDown className="chevron" />
                </summary>
                <div className="event-list">
                  {day.events.map((event) => (
                    <article key={event.id} className={`event-row status-${event.status}`}>
                      <time>{event.time}</time>
                      <span className="event-dot" aria-hidden="true" />
                      <div>
                        <div className="event-title-line"><h3>{event.title}</h3>{event.status !== 'scheduled' && <span className="status-badge">{statusLabel[event.status]}</span>}</div>
                        {event.details && <p>{event.details}</p>}
                        {event.location && <small><MapPin /> {event.location}</small>}
                        {event.statusNote && <div className="status-note"><AlertTriangle /> {event.statusNote}</div>}
                      </div>
                    </article>
                  ))}
                </div>
              </details>
            ))}
            {filteredDays.length === 0 && <div className="empty-state"><Search /><h3>Agenda tidak ditemukan</h3><p>Coba kata kunci atau kota lain.</p></div>}
          </div>
        </section>

        <section className="flight-section">
          <div className="section-heading compact"><div><p className="eyebrow">Penerbangan</p><h2>Jadwal Emirates</h2></div><Plane /></div>
          <div className="flight-grid">
            {data.flights.map((flight) => (
              <article key={flight.flight} className="flight-card">
                <div><small>{flight.date}</small><strong>{flight.route}</strong></div>
                <p>{flight.flight}</p><time>{flight.time}</time>
              </article>
            ))}
          </div>
        </section>

        <footer>
          <div><img className="footer-logo" src="/logo.png" alt="Ash-Shiddiq Tour & Travel" /><p><small>PT. Hasan Berkah Wisata · PPIU 09102303094760001</small></p></div>
          <a href="/admin">Halaman pengelola <ExternalLink /></a>
        </footer>
      </div>

      <div className="sr-only" aria-live="polite">{liveMessage}</div>
      {liveMessage && <button className="live-toast" onClick={() => setLiveMessage('')}><CheckCircle2 /> {liveMessage}</button>}
    </main>
  );
}
