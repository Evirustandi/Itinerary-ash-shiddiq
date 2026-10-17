export const dynamic = 'force-dynamic';

const cities = {
  makkah: { latitude: 21.4225, longitude: 39.8262, label: 'Makkah' },
  madinah: { latitude: 24.4672, longitude: 39.6111, label: 'Madinah' },
} as const;

export async function GET(request: Request) {
  const cityKey = new URL(request.url).searchParams.get('city');
  if (cityKey !== 'makkah' && cityKey !== 'madinah') {
    return Response.json({ message: 'Kota tidak tersedia.' }, { status: 400 });
  }

  const today = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Riyadh', day: '2-digit', month: '2-digit', year: 'numeric',
  }).format(new Date()).replaceAll('/', '-');
  const city = cities[cityKey];
  const url = `https://api.aladhan.com/v1/timings/${today}?latitude=${city.latitude}&longitude=${city.longitude}&method=4&timezonestring=Asia%2FRiyadh`;

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Prayer service unavailable');
    const payload = await response.json() as { data?: { timings?: Record<string, string> } };
    const timings = payload.data?.timings;
    if (!timings) throw new Error('Prayer timings missing');
    const names = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
    const prayers = names.map((name) => ({ name, time: timings[name]?.match(/^\d{2}:\d{2}/)?.[0] ?? '' }));
    if (prayers.some((prayer) => !prayer.time)) throw new Error('Prayer timings incomplete');
    return Response.json({ city: city.label, date: today, prayers }, { headers: { 'Cache-Control': 'public, max-age=900' } });
  } catch {
    return Response.json({ message: 'Jadwal salat belum dapat dimuat. Coba beberapa saat lagi.' }, { status: 503 });
  }
}
