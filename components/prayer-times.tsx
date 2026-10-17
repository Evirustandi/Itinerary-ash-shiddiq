'use client';

import { useEffect, useState } from 'react';
import { Clock3, RefreshCw } from 'lucide-react';

type Prayer = { name: string; time: string };
type PrayerResponse = { city: string; date: string; prayers: Prayer[] };
const names: Record<string, string> = { Fajr: 'Subuh', Dhuhr: 'Zuhur', Asr: 'Asar', Maghrib: 'Magrib', Isha: 'Isya' };

export function PrayerTimes() {
  const [city, setCity] = useState<'makkah' | 'madinah'>('makkah');
  const [data, setData] = useState<PrayerResponse | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError('');
    fetch(`/api/prayer-times?city=${city}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Jadwal salat belum dapat dimuat.');
        return response.json() as Promise<PrayerResponse>;
      })
      .then(setData)
      .catch((cause) => { if (cause.name !== 'AbortError') setError('Jadwal salat belum dapat dimuat. Coba lagi nanti.'); });
    return () => controller.abort();
  }, [city, retry]);

  return <section className="prayer-card" aria-labelledby="prayer-title">
    <div className="prayer-heading"><div><p className="eyebrow"><Clock3 /> Waktu setempat Arab Saudi</p><h2 id="prayer-title">Jadwal salat hari ini</h2><p>Pilih kota untuk melihat waktu salat setempat.</p></div><div className="prayer-cities" aria-label="Kota jadwal salat"><button type="button" className={city === 'makkah' ? 'active' : ''} onClick={() => setCity('makkah')}>Makkah</button><button type="button" className={city === 'madinah' ? 'active' : ''} onClick={() => setCity('madinah')}>Madinah</button></div></div>
    {data ? <><div className="prayer-list">{data.prayers.map((prayer) => <div key={prayer.name}><span>{names[prayer.name]}</span><strong>{prayer.time}</strong></div>)}</div><p className="prayer-note">{data.city} · {data.date} · Zona waktu Arab Saudi (UTC+3). Perhitungan Umm Al-Qura via AlAdhan; ikuti pengumuman masjid setempat jika berbeda.</p></> : <div className="prayer-state" role="status">{error ? <>{error} <button type="button" onClick={() => setRetry((value) => value + 1)}><RefreshCw /> Coba lagi</button></> : 'Memuat jadwal salat…'}</div>}
  </section>;
}
