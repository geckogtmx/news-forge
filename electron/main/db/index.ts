import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import * as schema from './schema';

// Ensure the DB is stored in User Data to persist across updates
// In dev, we might want it in the project root?
// Better: User Data for production feel.
const dbPath = process.env.NODE_ENV === 'development'
    ? path.join(process.cwd(), 'newsforge.db')
    : path.join(app.getPath('userData'), 'newsforge.db');

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Helper to run migrations or init? defined elsewhere.
