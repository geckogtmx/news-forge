import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Core user table.
 * Adapted for SQLite (single user local app, but keeping structure).
 */
export const users = sqliteTable("users", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    openId: text("openId").notNull().unique(),
    name: text("name"),
    email: text("email"),
    loginMethod: text("loginMethod"),
    role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
    createdAt: integer("createdAt", { mode: 'timestamp' }).default(new Date()).notNull(), // SQLite doesn't have reliable defaultNow() for timestamps in ms
    updatedAt: integer("updatedAt", { mode: 'timestamp' }).$onUpdate(() => new Date()), // Drizzle helper
    lastSignedIn: integer("lastSignedIn", { mode: 'timestamp' }).default(new Date()).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// NewsForge Tables

export const newsSources = sqliteTable("newsSources", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    name: text("name").notNull(),
    type: text("type", { enum: ["rss", "gmail", "youtube", "website", "arxiv", "huggingface"] }).notNull(),
    config: text("config", { mode: 'json' }).notNull(),
    topics: text("topics", { mode: 'json' }).notNull(),
    isActive: integer("isActive", { mode: 'boolean' }).default(true).notNull(),
    createdAt: integer("createdAt", { mode: 'timestamp' }).default(new Date()).notNull(),
    updatedAt: integer("updatedAt", { mode: 'timestamp' }).$onUpdate(() => new Date()).notNull(),
});

export type NewsSource = typeof newsSources.$inferSelect;
export type InsertNewsSource = typeof newsSources.$inferInsert;

export const runs = sqliteTable("runs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull(),
    status: text("status", { enum: ["draft", "collecting", "compiling", "reviewing", "completed", "archived"] }).default("draft").notNull(),
    startedAt: integer("startedAt", { mode: 'timestamp' }).default(new Date()).notNull(),
    completedAt: integer("completedAt", { mode: 'timestamp' }),
    stats: text("stats", { mode: 'json' }).notNull(),
    createdAt: integer("createdAt", { mode: 'timestamp' }).default(new Date()).notNull(),
    updatedAt: integer("updatedAt", { mode: 'timestamp' }).$onUpdate(() => new Date()).notNull(),
});

export type Run = typeof runs.$inferSelect;
export type InsertRun = typeof runs.$inferInsert;

export const rawHeadlines = sqliteTable("rawHeadlines", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    runId: integer("runId").notNull(),
    sourceId: integer("sourceId").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    url: text("url").notNull(),
    publishedAt: integer("publishedAt", { mode: 'timestamp' }),
    source: text("source", { enum: ["rss", "gmail", "youtube", "website", "arxiv", "huggingface"] }).notNull(),
    isSelected: integer("isSelected", { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer("createdAt", { mode: 'timestamp' }).default(new Date()).notNull(),
});

export type RawHeadline = typeof rawHeadlines.$inferSelect;
export type InsertRawHeadline = typeof rawHeadlines.$inferInsert;

export const compiledItems = sqliteTable("compiledItems", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    runId: integer("runId").notNull(),
    topic: text("topic").notNull(),
    hook: text("hook").notNull(),
    summary: text("summary").notNull(),
    sourceHeadlineIds: text("sourceHeadlineIds", { mode: 'json' }).notNull(),
    isSelected: integer("isSelected", { mode: 'boolean' }).default(false).notNull(),
    createdAt: integer("createdAt", { mode: 'timestamp' }).default(new Date()).notNull(),
    updatedAt: integer("updatedAt", { mode: 'timestamp' }).$onUpdate(() => new Date()).notNull(),
});

export type CompiledItem = typeof compiledItems.$inferSelect;
export type InsertCompiledItem = typeof compiledItems.$inferInsert;

export const contentPackages = sqliteTable("contentPackages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    runId: integer("runId").notNull(),
    compiledItemId: integer("compiledItemId").notNull(),
    youtubeTitle: text("youtubeTitle"),
    youtubeDescription: text("youtubeDescription"),
    scriptOutline: text("scriptOutline"),
    status: text("status", { enum: ["draft", "ready", "exported"] }).default("draft").notNull(),
    createdAt: integer("createdAt", { mode: 'timestamp' }).default(new Date()).notNull(),
    updatedAt: integer("updatedAt", { mode: 'timestamp' }).$onUpdate(() => new Date()).notNull(),
});

export type ContentPackage = typeof contentPackages.$inferSelect;
export type InsertContentPackage = typeof contentPackages.$inferInsert;

export const runArchives = sqliteTable("runArchives", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    runId: integer("runId").notNull(),
    userId: integer("userId").notNull(),
    archivedData: text("archivedData", { mode: 'json' }).notNull(),
    obsidianExportPath: text("obsidianExportPath"),
    archivedAt: integer("archivedAt", { mode: 'timestamp' }).default(new Date()).notNull(),
});

export type RunArchive = typeof runArchives.$inferSelect;
export type InsertRunArchive = typeof runArchives.$inferInsert;

export const userSettings = sqliteTable("userSettings", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("userId").notNull().unique(),
    tone: text("tone").default("professional").notNull(),
    format: text("format", { mode: 'json' }).notNull(),
    obsidianVaultPath: text("obsidianVaultPath"),
    llmModel: text("llmModel").default("claude-3.5-sonnet").notNull(),
    updatedAt: integer("updatedAt", { mode: 'timestamp' }).$onUpdate(() => new Date()).notNull(),
});

export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = typeof userSettings.$inferInsert;
