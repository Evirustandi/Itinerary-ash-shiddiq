'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Megaphone, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EventStatus, ItineraryEvent, ItineraryPayload } from '@/lib/itinerary-data';

type EditFields = Pick<ItineraryEvent, 'time' | 'title' | 'details' | 'location' | 'status' | 'statusNote'>;

export function AdminApp() {
  const [data, setData] = useState<ItineraryPayload | null>(null);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [fields, setFields] = useState<EditFields | null>(null);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState<'event' | 'notice' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    const response = await fetch('/api/itinerary', { cache: 'no-store' });
    if (!response.ok) throw new Error('Data itinerary belum dapat dimuat.');
    const payload = await response.json() as ItineraryPayload;
    setData(payload);
    setNotice(payload.notice);
    if (!selectedId) setSelectedId(payload.days[0]?.events[0]?.id ?? '');
  }

  useEffect(() => { void loadData().catch((cause) => setError(cause.message)); }, []);

  const selectedEvent = useMemo(() => data?.days.flatMap((day) => day.events).find((event) => event.id === selectedId), [data, selectedId]);
  useEffect(() => {
    if (!selectedEvent) return;
    setFields({
      time: selectedEvent.time, title: selectedEvent.title, details: selectedEvent.details,
      location: selectedEvent.location, status: selectedEvent.status, statusNote: selectedEvent.statusNote,
    });
  }, [selectedEvent]);

  async function patch(body: unknown) {
    setError(''); setMessage('');
    const response = await fetch('/api/itinerary', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify(body),
    });
    const payload = await response.json() as ItineraryPayload & { message?: string };
    if (!response.ok) throw new Error(payload.message || 'Pembaruan gagal disimpan.');
    setData(payload);
    setNotice(payload.notice);
  }

  async function saveEvent() {
    if (!fields || !selectedId) return;
    setSaving('event');
    try {
      await patch({ kind: 'event', id: selectedId, updates: fields });
      setMessage('Agenda berhasil diperbarui dan langsung tampil untuk jemaah.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Pembaruan gagal.'); }
    finally { setSaving(null); }
  }

  async function saveNotice() {
    setSaving('notice');
    try {
      await patch({ kind: 'notice', value: notice });
      setMessage('Pengumuman berhasil diperbarui.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Pembaruan gagal.'); }
    finally { setSaving(null); }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a href="/"><ArrowLeft /> Kembali ke itinerary</a>
        <span><ShieldCheck /> Area pengelola</span>
      </header>

      <section className="admin-intro">
        <p className="eyebrow">Kontrol jadwal live</p>
        <h1>Perbarui informasi<br />untuk jemaah.</h1>
        <p>Perubahan yang disimpan akan muncul otomatis di halaman itinerary dalam sekitar 20 detik.</p>
      </section>

      <section className="admin-grid">
        <aside className="admin-sidebar">
          <label><span>Kode pengelola</span><div className="password-field"><Input type={showPasscode ? 'text' : 'password'} value={passcode} onChange={(event) => setPasscode(event.target.value)} placeholder="Masukkan kode" autoComplete="current-password" /><button onClick={() => setShowPasscode((value) => !value)} aria-label={showPasscode ? 'Sembunyikan kode' : 'Tampilkan kode'}>{showPasscode ? <EyeOff /> : <Eye />}</button></div></label>
          <p>Kode hanya dipakai saat menyimpan dan tidak ditampilkan kepada jemaah.</p>

          <div className="admin-divider" />
          <label><span>Pilih agenda</span><select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
            {data?.days.map((day) => (
              <optgroup key={day.dayNumber} label={`Hari ${day.dayNumber} · ${day.title}`}>
                {day.events.map((event) => <option key={event.id} value={event.id}>{event.time} · {event.title}</option>)}
              </optgroup>
            ))}
          </select></label>
        </aside>

        <div className="admin-main">
          <article className="admin-card">
            <div className="admin-card-heading"><div><small>Agenda terpilih</small><h2>{selectedEvent?.title ?? 'Memuat agenda…'}</h2></div><Save /></div>
            {fields && <div className="admin-form">
              <div className="two-fields">
                <label><span>Waktu</span><Input value={fields.time} onChange={(event) => setFields({ ...fields, time: event.target.value })} /></label>
                <label><span>Status</span><select value={fields.status} onChange={(event) => setFields({ ...fields, status: event.target.value as EventStatus })}><option value="scheduled">Terjadwal</option><option value="now">Berlangsung</option><option value="done">Selesai</option><option value="changed">Berubah</option></select></label>
              </div>
              <label><span>Judul agenda</span><Input value={fields.title} onChange={(event) => setFields({ ...fields, title: event.target.value })} /></label>
              <label><span>Lokasi</span><Input value={fields.location} onChange={(event) => setFields({ ...fields, location: event.target.value })} /></label>
              <label><span>Rincian</span><textarea value={fields.details} onChange={(event) => setFields({ ...fields, details: event.target.value })} rows={3} /></label>
              <label><span>Catatan perubahan</span><textarea value={fields.statusNote} onChange={(event) => setFields({ ...fields, statusNote: event.target.value })} rows={2} placeholder="Contoh: keberangkatan bus mundur 30 menit" /></label>
              <Button size="lg" onClick={() => void saveEvent()} disabled={saving !== null || !passcode}>{saving === 'event' ? <Loader2 className="animate-spin" /> : <Check />} Simpan agenda</Button>
            </div>}
          </article>

          <article className="admin-card notice-editor">
            <div className="admin-card-heading"><div><small>Pengumuman utama</small><h2>Pesan untuk semua jemaah</h2></div><Megaphone /></div>
            <textarea value={notice} onChange={(event) => setNotice(event.target.value)} rows={3} />
            <Button variant="outline" onClick={() => void saveNotice()} disabled={saving !== null || !passcode}>{saving === 'notice' ? <Loader2 className="animate-spin" /> : <Megaphone />} Perbarui pengumuman</Button>
          </article>

          {(message || error) && <div className={error ? 'admin-message error' : 'admin-message'}>{error || message}</div>}
        </div>
      </section>
    </main>
  );
}
