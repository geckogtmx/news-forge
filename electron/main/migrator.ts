import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from './db';
import path from 'path';

export async function runMigrations() {
    console.log('[Migrator] Starting database migration...');
    try {
        // In dev, root is 2 levels up from main/index.ts (electron/main -> root)
        // Adjust path logic as needed based on where this file is vs root.
        // running from 'e:\git\news-forge', migrations are in 'drizzle'
        // process.cwd() in electron dev usually points to project root.

        const migrationsFolder = path.join(process.cwd(), 'drizzle');
        console.log('[Migrator] Migrations folder:', migrationsFolder);

        await migrate(db, { migrationsFolder });
        console.log('[Migrator] Database migration complete!');
    } catch (error) {
        console.error('[Migrator] Migration failed:', error);
    }
}
