CREATE TABLE `compiledItems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`runId` integer NOT NULL,
	`topic` text NOT NULL,
	`hook` text NOT NULL,
	`summary` text NOT NULL,
	`sourceHeadlineIds` text NOT NULL,
	`isSelected` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-10T01:47:34.786Z"' NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `contentPackages` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`runId` integer NOT NULL,
	`compiledItemId` integer NOT NULL,
	`youtubeTitle` text,
	`youtubeDescription` text,
	`scriptOutline` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-10T01:47:34.786Z"' NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `newsSources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`config` text NOT NULL,
	`topics` text NOT NULL,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-10T01:47:34.786Z"' NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rawHeadlines` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`runId` integer NOT NULL,
	`sourceId` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`url` text NOT NULL,
	`publishedAt` integer,
	`source` text NOT NULL,
	`isSelected` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-10T01:47:34.786Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runArchives` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`runId` integer NOT NULL,
	`userId` integer NOT NULL,
	`archivedData` text NOT NULL,
	`obsidianExportPath` text,
	`archivedAt` integer DEFAULT '"2026-01-10T01:47:34.786Z"' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `runs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`startedAt` integer DEFAULT '"2026-01-10T01:47:34.786Z"' NOT NULL,
	`completedAt` integer,
	`stats` text NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-10T01:47:34.786Z"' NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `userSettings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`tone` text DEFAULT 'professional' NOT NULL,
	`format` text NOT NULL,
	`obsidianVaultPath` text,
	`llmModel` text DEFAULT 'claude-3.5-sonnet' NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `userSettings_userId_unique` ON `userSettings` (`userId`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'user' NOT NULL,
	`createdAt` integer DEFAULT '"2026-01-10T01:47:34.785Z"' NOT NULL,
	`updatedAt` integer,
	`lastSignedIn` integer DEFAULT '"2026-01-10T01:47:34.785Z"' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);