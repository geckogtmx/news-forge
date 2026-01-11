import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import { createRequire } from 'module';
import * as schema from './schema';

const require = createRequire(import.meta.url);

let dbPath: string;

try {
    // Try to load electron (will fail in Node scripts)
    const { app } = require('electron');

    // Use app methods if available
    dbPath = process.env.NODE_ENV === 'development'
        ? path.join(process.cwd(), 'newsforge.db')
        : path.join(app.getPath('userData'), 'newsforge.db');
} catch (error) {
    // Fallback for verification scripts or Node environment
    dbPath = path.join(process.cwd(), 'newsforge.db');
}

export const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Helper to run migrations or init? defined elsewhere.
