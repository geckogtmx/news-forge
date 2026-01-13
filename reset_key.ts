import { db } from './electron/main/db/index';
import { userSettings } from './electron/main/db/schema';
import { eq } from 'drizzle-orm';

async function resetGoogleKey() {
    try {
        console.log('Resetting Google API Key for user 1...');
        const userSettingsData = await db.query.userSettings.findFirst({
            where: eq(userSettings.userId, 1)
        });

        if (userSettingsData && userSettingsData.aiProviders) {
            const providers = userSettingsData.aiProviders as any;
            if (providers['google']) {
                providers['google'].apiKey = ''; // Clear key
                providers['google'].enabled = false; // Disable

                await db.update(userSettings)
                    .set({ aiProviders: providers })
                    .where(eq(userSettings.userId, 1));

                console.log('Google API Key cleared and provider disabled.');
            } else {
                console.log('Google provider not found in settings.');
            }
        } else {
            console.log('No settings found for user 1.');
        }
    } catch (error) {
        console.error('Failed to reset key:', error);
    }
}

resetGoogleKey();
