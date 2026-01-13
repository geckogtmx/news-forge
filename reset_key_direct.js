import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('newsforge.db');
console.log(`Opening database at: ${dbPath}`);

const db = new Database(dbPath);

try {
    // 1. Get current settings for user 1
    const row = db.prepare("SELECT aiProviders FROM userSettings WHERE userId = 1").get();

    if (row && row.aiProviders) {
        let providers = JSON.parse(row.aiProviders);

        if (providers.google) {
            console.log('Found Google provider. Resetting key...');
            providers.google.apiKey = ''; // Clear key
            providers.google.enabled = false; // Disable

            // 2. Update settings
            const info = db.prepare("UPDATE userSettings SET aiProviders = ? WHERE userId = 1")
                .run(JSON.stringify(providers));

            console.log(`Updated ${info.changes} rows.`);
            console.log('Google API Key cleared successfully.');
        } else {
            console.log('Google provider not configured.');
        }
    } else {
        console.log('No settings found for user 1.');
    }
} catch (error) {
    console.error('Error:', error);
}
db.close();
