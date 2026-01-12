PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_compiledItems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`runId` integer NOT NULL,
	`topic` text NOT NULL,
	`hook` text NOT NULL,
	`summary` text NOT NULL,
	`sourceHeadlineIds` text NOT NULL,
	`isSelected` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-12T17:22:03.221Z"' NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_compiledItems`("id", "runId", "topic", "hook", "summary", "sourceHeadlineIds", "isSelected", "createdAt", "updatedAt") SELECT "id", "runId", "topic", "hook", "summary", "sourceHeadlineIds", "isSelected", "createdAt", "updatedAt" FROM `compiledItems`;--> statement-breakpoint
DROP TABLE `compiledItems`;--> statement-breakpoint
ALTER TABLE `__new_compiledItems` RENAME TO `compiledItems`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_contentPackages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`runId` integer NOT NULL,
	`compiledItemId` integer NOT NULL,
	`youtubeTitle` text,
	`youtubeDescription` text,
	`scriptOutline` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-12T17:22:03.221Z"' NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_contentPackages`("id", "runId", "compiledItemId", "youtubeTitle", "youtubeDescription", "scriptOutline", "status", "createdAt", "updatedAt") SELECT "id", "runId", "compiledItemId", "youtubeTitle", "youtubeDescription", "scriptOutline", "status", "createdAt", "updatedAt" FROM `contentPackages`;--> statement-breakpoint
DROP TABLE `contentPackages`;--> statement-breakpoint
ALTER TABLE `__new_contentPackages` RENAME TO `contentPackages`;--> statement-breakpoint
CREATE TABLE `__new_newsSources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`config` text NOT NULL,
	`topics` text NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-12T17:22:03.220Z"' NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_newsSources`("id", "userId", "name", "type", "config", "topics", "isActive", "createdAt", "updatedAt") SELECT "id", "userId", "name", "type", "config", "topics", "isActive", "createdAt", "updatedAt" FROM `newsSources`;--> statement-breakpoint
DROP TABLE `newsSources`;--> statement-breakpoint
ALTER TABLE `__new_newsSources` RENAME TO `newsSources`;--> statement-breakpoint
CREATE TABLE `__new_rawHeadlines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`runId` integer NOT NULL,
	`sourceId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`url` text NOT NULL,
	`publishedAt` integer,
	`source` text NOT NULL,
	`isSelected` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-12T17:22:03.221Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_rawHeadlines`("id", "runId", "sourceId", "title", "description", "url", "publishedAt", "source", "isSelected", "createdAt") SELECT "id", "runId", "sourceId", "title", "description", "url", "publishedAt", "source", "isSelected", "createdAt" FROM `rawHeadlines`;--> statement-breakpoint
DROP TABLE `rawHeadlines`;--> statement-breakpoint
ALTER TABLE `__new_rawHeadlines` RENAME TO `rawHeadlines`;--> statement-breakpoint
CREATE TABLE `__new_runArchives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`runId` integer NOT NULL,
	`userId` integer NOT NULL,
	`archivedData` text NOT NULL,
	`obsidianExportPath` text,
	`archivedAt` integer DEFAULT '"2026-01-12T17:22:03.221Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_runArchives`("id", "runId", "userId", "archivedData", "obsidianExportPath", "archivedAt") SELECT "id", "runId", "userId", "archivedData", "obsidianExportPath", "archivedAt" FROM `runArchives`;--> statement-breakpoint
DROP TABLE `runArchives`;--> statement-breakpoint
ALTER TABLE `__new_runArchives` RENAME TO `runArchives`;--> statement-breakpoint
CREATE TABLE `__new_runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`startedAt` integer DEFAULT '"2026-01-12T17:22:03.221Z"' NOT NULL,
	`completedAt` integer,
	`stats` text NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-12T17:22:03.221Z"' NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_runs`("id", "userId", "status", "startedAt", "completedAt", "stats", "createdAt", "updatedAt") SELECT "id", "userId", "status", "startedAt", "completedAt", "stats", "createdAt", "updatedAt" FROM `runs`;--> statement-breakpoint
DROP TABLE `runs`;--> statement-breakpoint
ALTER TABLE `__new_runs` RENAME TO `runs`;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-12T17:22:03.220Z"' NOT NULL,
	`updatedAt` integer,
	`lastSignedIn` integer DEFAULT '"2026-01-12T17:22:03.220Z"' NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "openId", "name", "email", "loginMethod", "role", "createdAt", "updatedAt", "lastSignedIn") SELECT "id", "openId", "name", "email", "loginMethod", "role", "createdAt", "updatedAt", "lastSignedIn" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);