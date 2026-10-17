'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, ChevronDown, Clock3,
  ContactRound, ExternalLink, Hotel, MapPin, MessageCircle, Plane, Radio, RefreshCw, Search, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EventStatus, ItineraryDay, ItineraryPayload } from '@/lib/itinerary-data';

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

function findFocusDay(days: ItineraryDay[], departure: Date) {
  const today = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return days.find((day) => day.date === today) ?? (new Date() < departure ? days[0] : days.at(-1));
}

function whatsappHref(phone: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = `62${digits.slice(1)}`;
  return digits ? `https://wa.me/${digits}` : '';
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
      const response = await fetch(`/api/itinerary?trip=${encodeURIComponent(initialData.tripSlug)}`, { cache: 'no-store' });
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
  }, [initialData.tripSlug]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 20_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const departure = useMemo(() => new Date(data.departureAt), [data.departureAt]);
  const tripEnd = useMemo(() => new Date(data.tripEndAt), [data.tripEndAt]);
  const focusDay = useMemo(() => findFocusDay(data.days, departure), [data.days, departure]);
  const daysToGo = Math.max(0, Math.ceil((departure.getTime() - Date.now()) / 86_400_000));
  const phase = new Date() < departure ? 'Agenda keberangkatan' : new Date() > tripEnd ? 'Perjalanan selesai' : 'Agenda hari ini';
  const cities = ['Semua', ...Array.from(new Set(data.days.map((day) => day.city)))];
  const supportVisible = [
    data.support.tourLeader.name, data.support.tourLeader.phone,
    data.support.mutawwif.name, data.support.mutawwif.phone,
    data.support.hotels.makkah.name, data.support.hotels.makkah.address,
    data.support.hotels.madinah.name, data.support.hotels.madinah.address,
  ].some(Boolean);

  const filteredDays = data.days.filter((day) => {
    const haystack = [day.title, day.city, day.weekday, day.date, formatDate(day.date), `hari ${day.dayNumber}`, ...day.events.flatMap((event) => [event.title, event.details, event.location])]
      .join(' ').toLowerCase();
    return (city === 'Semua' || day.city === city) && haystack.includes(query.trim().toLowerCase());
  });

  const updatedLabel = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta',
  }).format(new Date(data.updatedAt));

  return (
    <main className={`min-h-screen itinerary-theme-${data.theme}`}>
      <header className="site-header">
        <a href="/" className="brand-lockup" aria-label="Kembali ke halaman awal Ash-Shiddiq Tour & Travel">
          <img className="site-logo" src="/logo.png" alt="Ash-Shiddiq Tour & Travel" />
          <span className="brand-caption">Itinerary jemaah<small>Ash‑Shiddiq Tour & Travel</small></span>
        </a>
        <div className="header-actions">
          <span className="live-pill"><Radio /> Diperbarui otomatis</span>
          <Button variant="outline" size="sm" onClick={() => void refresh(true)} disabled={refreshing} aria-label="Segarkan jadwal">
            <RefreshCw className={refreshing ? 'animate-spin' : ''} /> <span className="hidden sm:inline">Segarkan</span>
          </Button>
        </div>
      </header>
      <nav className="itinerary-quicknav" aria-label="Navigasi itinerary">
        <a href="#atas">Ringkasan</a>{supportVisible && <a href="#support-title">Pendamping & hotel</a>}<a href="#jadwal">Jadwal harian</a><a href="#penerbangan">Penerbangan</a>
      </nav>

      <div id="atas" className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        <section className={`hero-grid itinerary-hero-${data.theme}`}>
          <div className="hero-panel">
            <p className="eyebrow"><span className="status-light" /> Jadwal perjalanan rombongan · {data.dateRange}</p>
            <h1>{data.tripName}</h1>
            <p className="hero-copy">Panduan waktu, tempat berkumpul, dan kegiatan ibadah yang selalu diperbarui oleh tim pendamping.</p>
            <div className="countdown-card">
              <div>
                <p className="mini-label">Keberangkatan</p>
                <p className="departure-date">{data.departureLabel}</p>
              </div>
              <div className="countdown-number">{new Date() < departure ? <>{daysToGo}<small>hari lagi</small></> : <small>{new Date() > tripEnd ? 'Perjalanan selesai' : 'Sedang berlangsung'}</small>}</div>
            </div>
          </div>
          <div className="journey-facts-card">
            <p className="mini-label">Rincian perjalanan</p>
            {data.flights.map((flight) => <div key={flight.flight} className="journey-flight"><Plane /><div><small>{flight.date} · {flight.flight}</small><strong>{flight.route}</strong><span>{flight.time}</span></div></div>)}
            <div className="journey-facts-footer"><CalendarDays /> {data.days.length} hari perjalanan <span>•</span> {data.timezoneNote}</div>
          </div>
        </section>

        {focusDay && <section className="focus-day-card" aria-label={phase}>
          <div className="focus-day-heading"><span className="day-badge">Hari {focusDay.dayNumber}</span><div><p className="eyebrow">{phase} · {formatDate(focusDay.date)} · {focusDay.city}</p><h2>{focusDay.title}</h2></div><a href={`#hari-${focusDay.dayNumber}`}>Lihat agenda lengkap <ArrowRight /></a></div>
          <div className="focus-day-events">{focusDay.events.slice(0, 4).map((event) => <div key={event.id}><time>{event.time}</time><span>{event.title}</span></div>)}</div>
          <p className="updated"><Clock3 /> Terakhir diperbarui {updatedLabel} WIB</p>
        </section>}

        <section className="notice-card" aria-label="Pengumuman perjalanan">
          <span className="notice-icon"><Sparkles /></span>
          <div><p>Info untuk jemaah</p><strong>{data.notice}</strong></div>
        </section>

        {data.highlights?.length ? <section className="trip-highlights" aria-label="Ringkasan perjalanan">
          {data.highlights.map((item) => <p key={item}><CheckCircle2 /> {item}</p>)}
        </section> : null}

        {supportVisible && <section className="support-section" aria-labelledby="support-title">
          <div className="section-heading">
            <div><p className="eyebrow">Informasi penting</p><h2 id="support-title">Pendamping & akomodasi</h2><p>Simpan kontak ini dan kenali tempat menginap selama perjalanan.</p></div>
          </div>
          <div className="support-grid">
            {(data.support.tourLeader.name || data.support.tourLeader.phone) && <article className="support-card contact-card">
              <span className="support-icon"><ContactRound /></span><div><small>Tour Leader</small><h3>{data.support.tourLeader.name || 'Kontak Tour Leader'}</h3>{data.support.tourLeader.phone && <><a href={whatsappHref(data.support.tourLeader.phone)} target="_blank" rel="noreferrer"><MessageCircle /> {data.support.tourLeader.phone}</a><span className="contact-hint">Klik nomor untuk menghubungi</span></>}</div>
            </article>}
            {(data.support.mutawwif.name || data.support.mutawwif.phone) && <article className="support-card contact-card">
              <span className="support-icon"><ContactRound /></span><div><small>Muthawwif</small><h3>{data.support.mutawwif.name || 'Kontak Muthawwif'}</h3>{data.support.mutawwif.phone && <><a href={whatsappHref(data.support.mutawwif.phone)} target="_blank" rel="noreferrer"><MessageCircle /> {data.support.mutawwif.phone}</a><span className="contact-hint">Klik nomor untuk menghubungi</span></>}</div>
            </article>}
            {(data.support.hotels.makkah.name || data.support.hotels.makkah.address) && <article className="support-card hotel-card">
              <span className="support-icon"><Hotel /></span><div><small>Hotel Makkah</small><h3>{data.support.hotels.makkah.name || 'Akomodasi Makkah'}</h3>{data.support.hotels.makkah.address && <p><MapPin /> {data.support.hotels.makkah.address}</p>}</div>
            </article>}
            {(data.support.hotels.madinah.name || data.support.hotels.madinah.address) && <article className="support-card hotel-card">
              <span className="support-icon"><Hotel /></span><div><small>Hotel Madinah</small><h3>{data.support.hotels.madinah.name || 'Akomodasi Madinah'}</h3>{data.support.hotels.madinah.address && <p><MapPin /> {data.support.hotels.madinah.address}</p>}</div>
            </article>}
          </div>
        </section>}

        <section id="jadwal" className="schedule-section">
          <div className="section-heading">
            <div><p className="eyebrow">Itinerary lengkap</p><h2>Jadwal perjalanan</h2><p>Ketuk setiap hari untuk melihat rincian. {data.timezoneNote}</p></div>
            <span>{filteredDays.length} hari ditampilkan</span>
          </div>

          <div className="schedule-controls">
            <label className="search-field"><span className="search-label">Cari jadwal</span><span className="search-input-wrap"><Search /><Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tanggal, kota, atau kegiatan…" /></span></label>
            <div className="city-filters" aria-label="Filter kota">
              {cities.map((option) => <button key={option} className={city === option ? 'active' : ''} onClick={() => setCity(option)}>{option}</button>)}
            </div>
          </div>

          <nav className="day-jump" aria-label="Lompat ke hari perjalanan">
            {filteredDays.map((day) => <a key={day.dayNumber} className={day.dayNumber === focusDay?.dayNumber ? 'is-current' : ''} href={`#hari-${day.dayNumber}`} onClick={() => { const target = document.getElementById(`hari-${day.dayNumber}`); if (target instanceof HTMLDetailsElement) target.open = true; }}><small>Hari {String(day.dayNumber).padStart(2, '0')}</small><strong>{day.title}</strong><span>{formatDate(day.date)}</span></a>)}
          </nav>

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

        <section id="penerbangan" className="flight-section">
          <div className="section-heading compact"><div><p className="eyebrow">Penerbangan</p><h2>Jadwal penerbangan</h2></div><Plane /></div>
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
          <a href={`/admin?trip=${data.tripSlug}`}>Halaman pengelola <ExternalLink /></a>
        </footer>
      </div>

      <div className="sr-only" aria-live="polite">{liveMessage}</div>
      {liveMessage && <button className="live-toast" onClick={() => setLiveMessage('')}><CheckCircle2 /> {liveMessage}</button>}
    </main>
  );
}
