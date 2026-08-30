CREATE TABLE `itinerary_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`day_number` integer NOT NULL,
	`date` text NOT NULL,
	`weekday` text NOT NULL,
	`title` text NOT NULL,
	`city` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_itinerary_days_day_number` ON `itinerary_days` (`day_number`);
--> statement-breakpoint
CREATE INDEX `idx_itinerary_days_date` ON `itinerary_days` (`date`);
--> statement-breakpoint
CREATE TABLE `itinerary_events` (
	`id` text PRIMARY KEY NOT NULL,
	`day_number` integer NOT NULL,
	`time` text NOT NULL,
	`title` text NOT NULL,
	`details` text DEFAULT '' NOT NULL,
	`location` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`status_note` text DEFAULT '' NOT NULL,
	`sort_order` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_itinerary_events_day_order` ON `itinerary_events` (`day_number`,`sort_order`);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text NOT NULL
);
