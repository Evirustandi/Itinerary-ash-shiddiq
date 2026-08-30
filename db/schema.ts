import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const itineraryDays = sqliteTable(
  'itinerary_days',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    dayNumber: integer('day_number').notNull(),
    date: text('date').notNull(),
    weekday: text('weekday').notNull(),
    title: text('title').notNull(),
    city: text('city').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('idx_itinerary_days_day_number').on(table.dayNumber), index('idx_itinerary_days_date').on(table.date)],
);

export const itineraryEvents = sqliteTable(
  'itinerary_events',
  {
    id: text('id').primaryKey(),
    dayNumber: integer('day_number').notNull(),
    time: text('time').notNull(),
    title: text('title').notNull(),
    details: text('details').notNull().default(''),
    location: text('location').notNull().default(''),
    status: text('status').notNull().default('scheduled'),
    statusNote: text('status_note').notNull().default(''),
    sortOrder: integer('sort_order').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [index('idx_itinerary_events_day_order').on(table.dayNumber, table.sortOrder)],
);

export const siteSettings = sqliteTable('site_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull(),
});
