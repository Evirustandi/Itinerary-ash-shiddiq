'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, Eye, EyeOff, FileAudio, Loader2, Megaphone, Play, RotateCcw, Save, ShieldCheck, Square, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EventStatus, ItineraryEvent, ItineraryPayload } from '@/lib/itinerary-data';

type EditFields = Pick<ItineraryEvent, 'time' | 'title' | 'details' | 'location' | 'status' | 'statusNote'>;
type AudioInfo = { source: 'default' | 'custom'; filename: string; contentType: string; size: number; updatedAt?: string };

export function AdminApp() {
  const [data, setData] = useState<ItineraryPayload | null>(null);
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [fields, setFields] = useState<EditFields | null>(null);
  const [notice, setNotice] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioInfo, setAudioInfo] = useState<AudioInfo | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const previewRef = useRef<HTMLAudioElement | null>(null);
  const previewUrlRef = useRef('');
  const [saving, setSaving] = useState<'event' | 'notice' | 'audio' | 'audio-reset' | null>(null);
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
  }, []);

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
        <a href="/itinerary"><ArrowLeft /> Kembali ke itinerary</a>
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
