import { env } from 'cloudflare:workers';
import { itinerarySeed, type EventStatus, type ItineraryPayload } from './itinerary-data';

let initialized = false;

async function ensureDatabase() {
  if (initialized) return;
  const db = env.DB;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS itinerary_days (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_number INTEGER NOT NULL UNIQUE,
      date TEXT NOT NULL,
      weekday TEXT NOT NULL,
      title TEXT NOT NULL,
      city TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_itinerary_days_date ON itinerary_days(date)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS itinerary_events (
      id TEXT PRIMARY KEY,
      day_number INTEGER NOT NULL,
      time TEXT NOT NULL,
      title TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      location TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'scheduled',
      status_note TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_itinerary_events_day_order ON itinerary_events(day_number, sort_order)'),
    db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
  ]);

  const count = await db.prepare('SELECT COUNT(*) AS count FROM itinerary_days').first<{ count: number }>();
  if (!count?.count) {
    const statements: D1PreparedStatement[] = [];
    for (const day of itinerarySeed.days) {
      statements.push(
        db.prepare(`INSERT INTO itinerary_days (day_number, date, weekday, title, city, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)`)
          .bind(day.dayNumber, day.date, day.weekday, day.title, day.city, itinerarySeed.updatedAt),
      );
      for (const event of day.events) {
        statements.push(
          db.prepare(`INSERT INTO itinerary_events
            (id, day_number, time, title, details, location, status, status_note, sort_order, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .bind(event.id, event.dayNumber, event.time, event.title, event.details, event.location, event.status, event.statusNote, event.sortOrder, event.updatedAt),
        );
      }
    }
    statements.push(
      db.prepare('INSERT INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)')
        .bind('notice', itinerarySeed.notice, itinerarySeed.updatedAt),
    );
    await db.batch(statements);
    await db.prepare('PRAGMA optimize').run();
  }
  initialized = true;
}

type DayRow = { day_number: number; date: string; weekday: string; title: string; city: string; updated_at: string };
type EventRow = {
  id: string; day_number: number; time: string; title: string; details: string; location: string;
  status: EventStatus; status_note: string; sort_order: number; updated_at: string;
};

export async function getItinerary(): Promise<ItineraryPayload> {
  await ensureDatabase();
  const db = env.DB;
  const [dayResult, eventResult, notice] = await Promise.all([
    db.prepare('SELECT day_number, date, weekday, title, city, updated_at FROM itinerary_days ORDER BY day_number').all<DayRow>(),
    db.prepare(`SELECT id, day_number, time, title, details, location, status, status_note, sort_order, updated_at
      FROM itinerary_events ORDER BY day_number, sort_order`).all<EventRow>(),
    db.prepare("SELECT value, updated_at FROM site_settings WHERE key = 'notice'").first<{ value: string; updated_at: string }>(),
  ]);

  const eventsByDay = new Map<number, EventRow[]>();
  for (const row of eventResult.results) {
    const list = eventsByDay.get(row.day_number) ?? [];
    list.push(row);
    eventsByDay.set(row.day_number, list);
  }

  const days = dayResult.results.map((row) => ({
    dayNumber: row.day_number,
    date: row.date,
    weekday: row.weekday,
    title: row.title,
    city: row.city,
    events: (eventsByDay.get(row.day_number) ?? []).map((event) => ({
      id: event.id,
      dayNumber: event.day_number,
      time: event.time,
      title: event.title,
      details: event.details,
      location: event.location,
      status: event.status,
      statusNote: event.status_note,
      sortOrder: event.sort_order,
      updatedAt: event.updated_at,
    })),
  }));

  const latest = [notice?.updated_at, ...dayResult.results.map((d) => d.updated_at), ...eventResult.results.map((e) => e.updated_at)]
    .filter(Boolean).sort().at(-1) ?? itinerarySeed.updatedAt;

  return { ...itinerarySeed, notice: notice?.value ?? itinerarySeed.notice, updatedAt: latest, days };
}

export async function updateEvent(
  id: string,
  updates: Partial<{ time: string; title: string; details: string; location: string; status: EventStatus; statusNote: string }>,
) {
  await ensureDatabase();
  const allowedStatus: EventStatus[] = ['scheduled', 'now', 'done', 'changed'];
  if (updates.status && !allowedStatus.includes(updates.status)) throw new Error('Status tidak valid.');

  const current = await env.DB.prepare('SELECT * FROM itinerary_events WHERE id = ?').bind(id).first<EventRow>();
  if (!current) throw new Error('Agenda tidak ditemukan.');
  const now = new Date().toISOString();

  await env.DB.prepare(`UPDATE itinerary_events SET time = ?, title = ?, details = ?, location = ?, status = ?, status_note = ?, updated_at = ? WHERE id = ?`)
    .bind(
      updates.time?.trim() || current.time,
      updates.title?.trim() || current.title,
      updates.details?.trim() ?? current.details,
      updates.location?.trim() ?? current.location,
      updates.status ?? current.status,
      updates.statusNote?.trim() ?? current.status_note,
      now,
      id,
    ).run();
}

export async function updateNotice(value: string) {
  await ensureDatabase();
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO site_settings (key, value, updated_at) VALUES ('notice', ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .bind(value.trim(), now).run();
}

export function isAdminPasscode(candidate: string | null) {
  const expected = env.ADMIN_PASSCODE;
  if (!candidate || !expected || candidate.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= candidate.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}
