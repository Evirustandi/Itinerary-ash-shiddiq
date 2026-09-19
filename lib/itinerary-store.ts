import { env } from 'cloudflare:workers';
import { itinerarySeed, itinerarySeeds, resolveTripSlug, type EventStatus, type ItineraryPayload, type TripSlug, type TripSupport } from './itinerary-data';

let initialized = false;

async function ensureDatabase() {
  if (initialized) return;
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS itinerary_days (id INTEGER PRIMARY KEY AUTOINCREMENT, day_number INTEGER NOT NULL UNIQUE, date TEXT NOT NULL, weekday TEXT NOT NULL, title TEXT NOT NULL, city TEXT NOT NULL, updated_at TEXT NOT NULL)`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_itinerary_days_date ON itinerary_days(date)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS itinerary_events (id TEXT PRIMARY KEY, day_number INTEGER NOT NULL, time TEXT NOT NULL, title TEXT NOT NULL, details TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'scheduled', status_note TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL, updated_at TEXT NOT NULL)`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_itinerary_events_day_order ON itinerary_events(day_number, sort_order)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`),
  ]);
  const count = await db.prepare('SELECT COUNT(*) AS count FROM itinerary_days').first<{ count: number }>();
  if (!count?.count) {
    const statements: D1PreparedStatement[] = [];
    for (const day of itinerarySeed.days) {
      statements.push(db.prepare(`INSERT INTO itinerary_days (day_number, date, weekday, title, city, updated_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .bind(day.dayNumber, day.date, day.weekday, day.title, day.city, itinerarySeed.updatedAt));
      for (const event of day.events) statements.push(db.prepare(`INSERT INTO itinerary_events (id, day_number, time, title, details, location, status, status_note, sort_order, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(event.id, event.dayNumber, event.time, event.title, event.details, event.location, event.status, event.statusNote, event.sortOrder, event.updatedAt));
    }
    statements.push(db.prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)').bind('notice', itinerarySeed.notice, itinerarySeed.updatedAt));
    await db.batch(statements);
    await db.prepare('PRAGMA optimize').run();
  }
  initialized = true;
}

type DayRow = { day_number: number; date: string; weekday: string; title: string; city: string; updated_at: string };
type EventRow = { id: string; day_number: number; time: string; title: string; details: string; location: string; status: EventStatus; status_note: string; sort_order: number; updated_at: string };

function normalizeGroup27Day(row: DayRow) {
  if (row.day_number === 11) return { ...row, title: 'Jabal Magnet' };
  return { ...row, title: row.title.replace(/Acara Bebas/gi, 'Free Program') };
}

function normalizeGroup27Event(event: EventRow) {
  if (event.day_number === 11 && event.sort_order === 3) {
    return { ...event, details: '' };
  }
  if ([8, 9, 10].includes(event.day_number) && /acara bebas/i.test(`${event.title} ${event.details}`)) {
    return {
      ...event,
      title: event.time === '15.00' ? 'Jamaah memaksimalkan ibadah masing-masing di Masjid Nabawi' : event.title,
      details: /acara bebas/i.test(event.details) ? '' : event.details,
    };
  }
  return {
    ...event,
    title: event.title.replace(/acara bebas/gi, 'Free Program'),
    details: event.details.replace(/acara bebas/gi, 'Free Program'),
  };
}

function settingKey(kind: 'payload' | 'notice' | 'support', slug: TripSlug) { return `trip:${slug}:${kind}`; }

async function getSecondaryItinerary(slug: TripSlug): Promise<ItineraryPayload> {
  const seed = itinerarySeeds[slug];
  const [payloadSetting, noticeSetting, supportSetting] = await Promise.all([
    env.DB.prepare('SELECT value, updated_at FROM site_settings WHERE key = ?').bind(settingKey('payload', slug)).first<{ value: string; updated_at: string }>(),
    env.DB.prepare('SELECT value, updated_at FROM site_settings WHERE key = ?').bind(settingKey('notice', slug)).first<{ value: string; updated_at: string }>(),
    env.DB.prepare('SELECT value, updated_at FROM site_settings WHERE key = ?').bind(settingKey('support', slug)).first<{ value: string; updated_at: string }>(),
  ]);
  let payload = structuredClone(seed) as ItineraryPayload;
  try { if (payloadSetting?.value) payload = { ...payload, ...JSON.parse(payloadSetting.value) as ItineraryPayload }; } catch { /* seed is the safe fallback */ }
  try { if (supportSetting?.value) payload.support = JSON.parse(supportSetting.value) as TripSupport; } catch { /* seed is the safe fallback */ }
  payload.notice = noticeSetting?.value ?? payload.notice;
  payload.days = payload.days.map((day) => day.title.includes('Jabal Magnet') ? {
    ...day,
    title: 'Jabal Magnet',
    events: day.events.map((event) => event.title.includes('Jabal Magnet') ? { ...event, details: '' } : event),
  } : day);
  payload.updatedAt = [payload.updatedAt, payloadSetting?.updated_at, noticeSetting?.updated_at, supportSetting?.updated_at].filter(Boolean).sort().at(-1) ?? payload.updatedAt;
  return payload;
}

export async function getItinerary(requestedSlug?: string | null): Promise<ItineraryPayload> {
  await ensureDatabase();
  const slug = resolveTripSlug(requestedSlug);
  if (slug !== '27-september-2026') return getSecondaryItinerary(slug);
  const [dayResult, eventResult, notice, supportSetting] = await Promise.all([
    env.DB.prepare('SELECT day_number, date, weekday, title, city, updated_at FROM itinerary_days ORDER BY day_number').all<DayRow>(),
    env.DB.prepare(`SELECT id, day_number, time, title, details, location, status, status_note, sort_order, updated_at FROM itinerary_events ORDER BY day_number, sort_order`).all<EventRow>(),
    env.DB.prepare("SELECT value, updated_at FROM site_settings WHERE key = 'notice'").first<{ value: string; updated_at: string }>(),
    env.DB.prepare("SELECT value, updated_at FROM site_settings WHERE key = 'trip_support'").first<{ value: string; updated_at: string }>(),
  ]);
  const eventsByDay = new Map<number, EventRow[]>();
  for (const rawRow of eventResult.results) { const row = normalizeGroup27Event(rawRow); const list = eventsByDay.get(row.day_number) ?? []; list.push(row); eventsByDay.set(row.day_number, list); }
  const days = dayResult.results.map(normalizeGroup27Day).map((row) => ({
    dayNumber: row.day_number, date: row.date, weekday: row.weekday, title: row.title, city: row.city,
    events: (eventsByDay.get(row.day_number) ?? []).map((event) => ({ id: event.id, dayNumber: event.day_number, time: event.time, title: event.title, details: event.details, location: event.location, status: event.status, statusNote: event.status_note, sortOrder: event.sort_order, updatedAt: event.updated_at })),
  }));
  let support = itinerarySeed.support;
  try { if (supportSetting?.value) support = JSON.parse(supportSetting.value) as TripSupport; } catch { /* seed is the safe fallback */ }
  const latest = [notice?.updated_at, supportSetting?.updated_at, ...dayResult.results.map((d) => d.updated_at), ...eventResult.results.map((e) => e.updated_at)].filter(Boolean).sort().at(-1) ?? itinerarySeed.updatedAt;
  return { ...itinerarySeed, notice: notice?.value ?? itinerarySeed.notice, support, updatedAt: latest, days };
}

export async function updateEvent(requestedSlug: string | null | undefined, id: string, updates: Partial<{ time: string; title: string; details: string; location: string; status: EventStatus; statusNote: string }>) {
  await ensureDatabase();
  const slug = resolveTripSlug(requestedSlug);
  const allowedStatus: EventStatus[] = ['scheduled', 'now', 'done', 'changed'];
  if (updates.status && !allowedStatus.includes(updates.status)) throw new Error('Status tidak valid.');
  const now = new Date().toISOString();
  if (slug !== '27-september-2026') {
    const payload = await getSecondaryItinerary(slug);
    const event = payload.days.flatMap((day) => day.events).find((item) => item.id === id);
    if (!event) throw new Error('Agenda tidak ditemukan.');
    event.time = updates.time?.trim() || event.time; event.title = updates.title?.trim() || event.title;
    event.details = updates.details?.trim() ?? event.details; event.location = updates.location?.trim() ?? event.location;
    event.status = updates.status ?? event.status; event.statusNote = updates.statusNote?.trim() ?? event.statusNote;
    event.updatedAt = now; payload.updatedAt = now;
    await env.DB.prepare(`INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
      .bind(settingKey('payload', slug), JSON.stringify(payload), now).run();
    return;
  }
  const current = await env.DB.prepare('SELECT * FROM itinerary_events WHERE id = ?').bind(id).first<EventRow>();
  if (!current) throw new Error('Agenda tidak ditemukan.');
  await env.DB.prepare(`UPDATE itinerary_events SET time = ?, title = ?, details = ?, location = ?, status = ?, status_note = ?, updated_at = ? WHERE id = ?`)
    .bind(updates.time?.trim() || current.time, updates.title?.trim() || current.title, updates.details?.trim() ?? current.details, updates.location?.trim() ?? current.location, updates.status ?? current.status, updates.statusNote?.trim() ?? current.status_note, now, id).run();
}

export async function updateNotice(requestedSlug: string | null | undefined, value: string) {
  await ensureDatabase();
  const slug = resolveTripSlug(requestedSlug); const key = slug === '27-september-2026' ? 'notice' : settingKey('notice', slug); const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).bind(key, value.trim(), now).run();
}

function cleanText(value: unknown, maxLength: number) { return String(value ?? '').trim().slice(0, maxLength); }

export async function updateSupport(requestedSlug: string | null | undefined, value: unknown) {
  await ensureDatabase();
  const slug = resolveTripSlug(requestedSlug); const input = (value && typeof value === 'object' ? value : {}) as Partial<TripSupport>;
  const support: TripSupport = {
    tourLeader: { name: cleanText(input.tourLeader?.name, 80), phone: cleanText(input.tourLeader?.phone, 32) },
    mutawwif: { name: cleanText(input.mutawwif?.name, 80), phone: cleanText(input.mutawwif?.phone, 32) },
    hotels: { makkah: { name: cleanText(input.hotels?.makkah?.name, 120), address: cleanText(input.hotels?.makkah?.address, 240) }, madinah: { name: cleanText(input.hotels?.madinah?.name, 120), address: cleanText(input.hotels?.madinah?.address, 240) } },
  };
  const key = slug === '27-september-2026' ? 'trip_support' : settingKey('support', slug); const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`).bind(key, JSON.stringify(support), now).run();
}

export function isAdminPasscode(candidate: string | null) {
  const expected = env.ADMIN_PASSCODE;
  if (!candidate || !expected || candidate.length !== expected.length) return false;
  let difference = 0; for (let index = 0; index < expected.length; index += 1) difference |= candidate.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}
