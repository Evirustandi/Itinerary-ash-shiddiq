'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CalendarDays, Check, ContactRound, Eye, EyeOff, FileAudio, Hotel, Loader2, Megaphone, Play, RotateCcw, Save, ShieldCheck, Square, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { resolveTripSlug, type EventStatus, type ItineraryEvent, type ItineraryPayload, type TripSlug, type TripSupport } from '@/lib/itinerary-data';

type EditFields = Pick<ItineraryEvent, 'time' | 'title' | 'details' | 'location' | 'status' | 'statusNote'>;
type AudioInfo = { source: 'default' | 'custom'; filename: string; contentType: string; size: number; updatedAt?: string };

export function AdminApp() {
  const [tripSlug, setTripSlug] = useState<TripSlug>(() => typeof window === 'undefined' ? '27-september-2026' : resolveTripSlug(new URLSearchParams(window.location.search).get('trip')));
  const [data, setData] = useState<ItineraryPayload | null>(null);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [fields, setFields] = useState<EditFields | null>(null);
  const [notice, setNotice] = useState('');
  const [support, setSupport] = useState<TripSupport | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef('');
  const [saving, setSaving] = useState<'event' | 'day' | 'notice' | 'support' | 'audio' | 'audio-reset' | null>(null);
  const [selectedDay, setSelectedDay] = useState(1);
  const [dayFields, setDayFields] = useState({ title: '', city: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadData() {
    const response = await fetch(`/api/itinerary?trip=${encodeURIComponent(tripSlug)}`, { cache: 'no-store' });
    if (!response.ok) throw new Error('Data itinerary belum dapat dimuat.');
    const payload = await response.json() as ItineraryPayload;
    setData(payload);
    setNotice(payload.notice);
    setSupport(payload.support);
    setSelectedDay((current) => payload.days.some((day) => day.dayNumber === current) ? current : payload.days[0]?.dayNumber ?? 1);
    setSelectedId((current) => current && payload.days.some((day) => day.events.some((event) => event.id === current)) ? current : payload.days[0]?.events[0]?.id ?? '');
  }

  async function loadAudioInfo() {
    const response = await fetch('/api/audio/manage', { cache: 'no-store' });
    if (!response.ok) throw new Error('Informasi audio belum dapat dimuat.');
    setAudioInfo(await response.json() as AudioInfo);
  }

  useEffect(() => {
    void Promise.all([loadData(), loadAudioInfo()]).catch((cause) => setError(cause.message));
    return () => {
      previewRef.current?.pause();
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, [tripSlug]);

  const selectedEvent = useMemo(() => data?.days.flatMap((day) => day.events).find((event) => event.id === selectedId), [data, selectedId]);
  useEffect(() => {
    if (!selectedEvent) return;
    setFields({
      time: selectedEvent.time, title: selectedEvent.title, details: selectedEvent.details,
      location: selectedEvent.location, status: selectedEvent.status, statusNote: selectedEvent.statusNote,
    });
  }, [selectedEvent]);

  const selectedDayData = useMemo(() => data?.days.find((day) => day.dayNumber === selectedDay), [data, selectedDay]);
  useEffect(() => {
    if (!selectedDayData) return;
    setDayFields({ title: selectedDayData.title, city: selectedDayData.city });
  }, [selectedDayData?.dayNumber, selectedDayData?.title, selectedDayData?.city]);

  async function patch(body: unknown) {
    setError(''); setMessage('');
    const response = await fetch('/api/itinerary', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-passcode': passcode },
      body: JSON.stringify({ ...(body as Record<string, unknown>), trip: tripSlug }),
    });
    const payload = await response.json() as ItineraryPayload & { message?: string };
    if (!response.ok) throw new Error(payload.message || 'Pembaruan gagal disimpan.');
    setData(payload);
    setNotice(payload.notice);
    setSupport(payload.support);
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

  async function saveDay() {
    setSaving('day');
    try {
      await patch({ kind: 'day', dayNumber: selectedDay, updates: dayFields });
      setMessage('Judul hari berhasil diperbarui dan langsung tampil untuk jemaah.');
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

  async function saveSupport() {
    if (!support) return;
    setSaving('support');
    try {
      await patch({ kind: 'support', updates: support });
      setMessage('Kontak pendamping dan informasi hotel berhasil diperbarui.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Informasi perjalanan gagal disimpan.'); }
    finally { setSaving(null); }
  }

  function stopPreview() {
    previewRef.current?.pause();
    previewRef.current = null;
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = '';
    setPreviewing(false);
  }

  async function previewAudio() {
    if (!audioFile) return;
    stopPreview();
    const url = URL.createObjectURL(audioFile);
    const audio = new Audio(url);
    previewUrlRef.current = url;
    previewRef.current = audio;
    audio.volume = 0.65;
    audio.addEventListener('ended', stopPreview, { once: true });
    try {
      await audio.play();
      setPreviewing(true);
    } catch {
      stopPreview();
      setError('Pratinjau audio tidak dapat diputar pada browser ini.');
    }
  }

  async function saveAudio() {
    if (!audioFile) return;
    stopPreview();
    setSaving('audio'); setError(''); setMessage('');
    try {
      const response = await fetch('/api/audio/manage', {
        method: 'POST',
        headers: {
          'Content-Type': audioFile.type || 'application/octet-stream',
          'x-admin-passcode': passcode,
          'x-audio-filename': encodeURIComponent(audioFile.name),
        },
        body: audioFile,
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Audio gagal disimpan.');
      setAudioFile(null);
      await loadAudioInfo();
      setMessage('Audio latar berhasil diganti dan akan dipakai saat perjalanan dimulai.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Audio gagal disimpan.'); }
    finally { setSaving(null); }
  }

  async function resetAudio() {
    stopPreview();
    setSaving('audio-reset'); setError(''); setMessage('');
    try {
      const response = await fetch('/api/audio/manage', { method: 'DELETE', headers: { 'x-admin-passcode': passcode } });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Audio gagal dikembalikan.');
      await loadAudioInfo();
      setMessage('Audio ambient bawaan digunakan kembali.');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Audio gagal dikembalikan.'); }
    finally { setSaving(null); }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <a href={`/itinerary/${tripSlug}`}><ArrowLeft /> Kembali ke itinerary</a>
        <img className="admin-logo" src="/logo.png" alt="Ash-Shiddiq Tour & Travel" />
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
          <label><span>Pilih grup</span><select value={tripSlug} onChange={(event) => { setTripSlug(event.target.value as TripSlug); setSelectedId(''); setMessage(''); setError(''); }}>
            <option value="27-september-2026">Grup 27 September 2026</option>
            <option value="29-september-2026">Grup 29 September 2026</option>
            <option value="1-november-2026">Grup 1 November 2026</option>
          </select></label>

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

          <article className="admin-card">
            <div className="admin-card-heading"><div><small>Judul hari</small><h2>Hari {selectedDay} · {selectedDayData?.title ?? 'Memuat…'}</h2></div><CalendarDays /></div>
            {selectedDayData && <div className="admin-form">
              <label><span>Pilih hari</span><select value={selectedDay} onChange={(event) => setSelectedDay(Number(event.target.value))}>
                {data?.days.map((day) => <option key={day.dayNumber} value={day.dayNumber}>Hari {day.dayNumber} · {day.title}</option>)}
              </select></label>
              <label><span>Judul hari</span><Input value={dayFields.title} onChange={(event) => setDayFields({ ...dayFields, title: event.target.value })} /></label>
              <label><span>Kota</span><Input value={dayFields.city} onChange={(event) => setDayFields({ ...dayFields, city: event.target.value })} /></label>
              <Button size="lg" onClick={() => void saveDay()} disabled={saving !== null || !passcode || !dayFields.title.trim()}>{saving === 'day' ? <Loader2 className="animate-spin" /> : <Check />} Simpan judul hari</Button>
            </div>}
          </article>

          <article className="admin-card notice-editor">
            <div className="admin-card-heading"><div><small>Pengumuman utama</small><h2>Pesan untuk semua jemaah</h2></div><Megaphone /></div>
            <textarea value={notice} onChange={(event) => setNotice(event.target.value)} rows={3} />
            <Button variant="outline" onClick={() => void saveNotice()} disabled={saving !== null || !passcode}>{saving === 'notice' ? <Loader2 className="animate-spin" /> : <Megaphone />} Perbarui pengumuman</Button>
          </article>

          {support && <article className="admin-card support-editor">
            <div className="admin-card-heading"><div><small>Kontak & akomodasi</small><h2>Pendamping dan hotel</h2></div><ContactRound /></div>
            <div className="admin-form">
              <div className="admin-subheading"><ContactRound /><div><strong>Pendamping jemaah</strong><small>Nomor akan menjadi tombol WhatsApp.</small></div></div>
              <div className="two-fields">
                <label><span>Nama Tour Leader</span><Input value={support.tourLeader.name} onChange={(event) => setSupport({ ...support, tourLeader: { ...support.tourLeader, name: event.target.value } })} placeholder="Contoh: Ustadz Ahmad" /></label>
                <label><span>WhatsApp Tour Leader</span><Input type="tel" value={support.tourLeader.phone} onChange={(event) => setSupport({ ...support, tourLeader: { ...support.tourLeader, phone: event.target.value } })} placeholder="Contoh: 0812 3456 7890" /></label>
                <label><span>Nama Muthawwif</span><Input value={support.mutawwif.name} onChange={(event) => setSupport({ ...support, mutawwif: { ...support.mutawwif, name: event.target.value } })} placeholder="Nama muthawwif" /></label>
                <label><span>WhatsApp Muthawwif</span><Input type="tel" value={support.mutawwif.phone} onChange={(event) => setSupport({ ...support, mutawwif: { ...support.mutawwif, phone: event.target.value } })} placeholder="Contoh: +966 50 123 4567" /></label>
              </div>

              <div className="admin-subheading"><Hotel /><div><strong>Hotel Makkah</strong><small>Nama dan alamat tempat menginap.</small></div></div>
              <label><span>Nama hotel Makkah</span><Input value={support.hotels.makkah.name} onChange={(event) => setSupport({ ...support, hotels: { ...support.hotels, makkah: { ...support.hotels.makkah, name: event.target.value } } })} placeholder="Nama hotel" /></label>
              <label><span>Alamat hotel Makkah</span><textarea value={support.hotels.makkah.address} onChange={(event) => setSupport({ ...support, hotels: { ...support.hotels, makkah: { ...support.hotels.makkah, address: event.target.value } } })} rows={2} placeholder="Alamat lengkap atau lokasi terdekat" /></label>

              <div className="admin-subheading"><Hotel /><div><strong>Hotel Madinah</strong><small>Nama dan alamat tempat menginap.</small></div></div>
              <label><span>Nama hotel Madinah</span><Input value={support.hotels.madinah.name} onChange={(event) => setSupport({ ...support, hotels: { ...support.hotels, madinah: { ...support.hotels.madinah, name: event.target.value } } })} placeholder="Nama hotel" /></label>
              <label><span>Alamat hotel Madinah</span><textarea value={support.hotels.madinah.address} onChange={(event) => setSupport({ ...support, hotels: { ...support.hotels, madinah: { ...support.hotels.madinah, address: event.target.value } } })} rows={2} placeholder="Alamat lengkap atau lokasi terdekat" /></label>
              <Button size="lg" onClick={() => void saveSupport()} disabled={saving !== null || !passcode}>{saving === 'support' ? <Loader2 className="animate-spin" /> : <Check />} Simpan kontak & hotel</Button>
            </div>
          </article>}

          <article className="admin-card audio-editor">
            <div className="admin-card-heading"><div><small>Audio latar</small><h2>Ganti audio perjalanan</h2></div><FileAudio /></div>
            <div className="current-audio">
              <FileAudio />
              <div><span>Sedang digunakan</span><strong>{audioInfo?.filename ?? 'Memuat informasi audio…'}</strong><small>{audioInfo ? `${audioInfo.source === 'default' ? 'Audio bawaan' : 'Audio pilihan Anda'} · ${(audioInfo.size / 1024 / 1024).toFixed(1)} MB` : ''}</small></div>
            </div>
            <label className="audio-file-field">
              <span>Pilih berkas baru</span>
              <input type="file" accept="audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a,audio/ogg,.mp3,.wav,.m4a,.ogg" onChange={(event) => { stopPreview(); setAudioFile(event.target.files?.[0] ?? null); }} />
              <small>MP3, WAV, M4A, atau OGG · maksimal 12 MB</small>
            </label>
            {audioFile && <div className="audio-file-actions">
              <p><strong>{audioFile.name}</strong><small>{(audioFile.size / 1024 / 1024).toFixed(1)} MB</small></p>
              <Button variant="outline" onClick={() => void (previewing ? Promise.resolve(stopPreview()) : previewAudio())}>{previewing ? <Square /> : <Play />} {previewing ? 'Hentikan' : 'Dengarkan'}</Button>
              <Button onClick={() => void saveAudio()} disabled={saving !== null || !passcode}>{saving === 'audio' ? <Loader2 className="animate-spin" /> : <Upload />} Simpan audio</Button>
            </div>}
            {audioInfo?.source === 'custom' && <button className="audio-reset" onClick={() => void resetAudio()} disabled={saving !== null || !passcode}>{saving === 'audio-reset' ? <Loader2 className="animate-spin" /> : <RotateCcw />} Gunakan audio bawaan</button>}
          </article>

          {(message || error) && <div className={error ? 'admin-message error' : 'admin-message'}>{error || message}</div>}
        </div>
      </section>
    </main>
  );
}
