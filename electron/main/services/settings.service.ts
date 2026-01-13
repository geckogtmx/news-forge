import { eq } from 'drizzle-orm';
import { safeStorage } from 'electron';
import { db } from '../db';
import { userSettings, type UserSettings, type InsertUserSettings } from '../db/schema';

/**
 * SettingsService - Handles all user settings-related database operations
 */
export class SettingsService {
    /**
     * Helper to encrypt text
     */
    private encrypt(text: string): string {
        if (!text) return text;
        if (safeStorage.isEncryptionAvailable()) {
            return safeStorage.encryptString(text).toString('base64');
        }
        return text; // Fallback (or throw error in strict mode)
    }

    /**
     * Helper to decrypt text
     */
    private decrypt(text: string): string {
        if (!text) return text;
        if (safeStorage.isEncryptionAvailable()) {
            try {
                return safeStorage.decryptString(Buffer.from(text, 'base64'));
            } catch (error) {
                console.error('Failed to decrypt settings:', error);
                return '';
            }
        }
        return text;
    }

    /**
     * Get or create settings for a user (Public - Masks secrets)
     */
    async getSettings(userId: number): Promise<UserSettings> {
        let result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        // If settings don't exist, create default settings
        let settings: UserSettings;
        if (result.length === 0) {
            settings = await this.createDefaultSettings(userId);
        } else {
            settings = result[0];
        }

        // Mask API keys for public/renderer consumption
        if (settings.aiProviders) {
            const maskedProviders = { ...settings.aiProviders } as any;
            for (const key in maskedProviders) {
                if (maskedProviders[key] && maskedProviders[key].apiKey) {
                    // Replace actual key with a flag indicating it exists
                    maskedProviders[key].apiKey = maskedProviders[key].apiKey ? '********' : '';
                    maskedProviders[key].isConfigured = true;
                }
            }
            settings.aiProviders = maskedProviders;
        }

        return settings;
    }

    /**
     * Get settings with decrypted secrets (Internal use only)
     */
    async getSecureSettings(userId: number): Promise<UserSettings> {
        let result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        if (result.length === 0) {
            return await this.createDefaultSettings(userId);
        }

        const settings = result[0];

        // Decrypt API keys
        if (settings.aiProviders) {
            const decryptedProviders = { ...settings.aiProviders } as any;
            for (const key in decryptedProviders) {
                if (decryptedProviders[key] && decryptedProviders[key].apiKey) {
                    decryptedProviders[key].apiKey = this.decrypt(decryptedProviders[key].apiKey);
                }
            }
            settings.aiProviders = decryptedProviders;
        }

        return settings;
    }

    /**
     * Create default settings for a user
     */
    async createDefaultSettings(userId: number): Promise<UserSettings> {
        const result = await db
            .insert(userSettings)
            .values({
                userId,
                tone: 'professional',
                format: {},
                llmModel: 'claude-3-5-sonnet-20241022',
            })
            .returning();
        return result[0];
    }

    /**
     * Update settings
     */
    async updateSettings(
        userId: number,
        data: Partial<Omit<UserSettings, 'id' | 'userId' | 'updatedAt'>>
    ): Promise<UserSettings> {
        // First, ensure settings exist
        await this.getSettings(userId);

        const result = await db
            .update(userSettings)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(userSettings.userId, userId))
            .returning();
        return result[0];
    }

    /**
     * Update Obsidian vault path
     */
    async updateObsidianPath(userId: number, path: string): Promise<UserSettings> {
        return await this.updateSettings(userId, { obsidianVaultPath: path });
    }

    /**
     * Update default LLM model
     */
    async updateDefaultModel(userId: number, model: string): Promise<UserSettings> {
        return await this.updateSettings(userId, { llmModel: model });
    }

    /**
     * Update tone preference
     */
    async updateTone(userId: number, tone: string): Promise<UserSettings> {
        return await this.updateSettings(userId, { tone });
    }

    /**
     * Update format preferences
     */
    async updateFormat(userId: number, format: any): Promise<UserSettings> {
        return await this.updateSettings(userId, { format });
    }

    /**
     * Get Obsidian vault path
     */
    async getObsidianPath(userId: number): Promise<string | null> {
        const settings = await this.getSettings(userId);
        return settings.obsidianVaultPath || null;
    }

    /**
     * Get default LLM model
     */
    async getDefaultModel(userId: number): Promise<string> {
        const settings = await this.getSettings(userId);
        return settings.llmModel;
    }

    /**
     * Delete settings (rarely used)
     */
    async deleteSettings(userId: number): Promise<boolean> {
        const result = await db.delete(userSettings).where(eq(userSettings.userId, userId)).returning();
        return result.length > 0;
    }

    /**
     * Reset settings to default
     */
    async resetSettings(userId: number): Promise<UserSettings> {
        // Delete existing settings
        await this.deleteSettings(userId);
        // Create new default settings
        return await this.createDefaultSettings(userId);
    }

    /**
     * Validate Obsidian path (basic check)
     */
    validateObsidianPath(path: string): { valid: boolean; error?: string } {
        if (!path || path.trim() === '') {
            return { valid: false, error: 'Path cannot be empty' };
        }

        // Add more validation as needed (check if directory exists, etc.)
        // For now, just basic validation
        return { valid: true };
    }

    /**
     * Get all settings (for admin/debugging)
     */
    async getAllSettings(): Promise<UserSettings[]> {
        return await db.select().from(userSettings);
    }

    /**
     * Get AI Providers config
     */
    async getAIProviders(userId: number): Promise<any> {
        const settings = await this.getSettings(userId);
        return settings.aiProviders;
    }

    /**
     * Update AI Provider config
     */
    async updateAIProvider(userId: number, providerId: string, config: any): Promise<UserSettings> {
        // Get raw secure settings first to merge properly (we need existing keys if not provided)
        // Actually, we usually save the whole config.
        // If config contains apiKey, encrypt it.
        // Create working copy
        const secureConfig = { ...config };

        // Fetch current settings first to handle masking logic
        let result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
        let currentProviders = result.length > 0 ? (result[0].aiProviders as any) || {} : {};

        // Handle API Key Encryption
        if (secureConfig.apiKey === '********') {
            // If the key is the mask, we MUST preserve the existing encrypted key from the database.
            // Do NOT re-encrypt the stars.
            if (currentProviders[providerId] && currentProviders[providerId].apiKey) {
                secureConfig.apiKey = currentProviders[providerId].apiKey;
            } else {
                // If no existing key but mask provided (weird state), clear it to be safe.
                secureConfig.apiKey = '';
            }
        } else if (secureConfig.apiKey) {
            // Assume it's a new plain-text key and encrypt it
            secureConfig.apiKey = this.encrypt(secureConfig.apiKey);
        }

        // Merge with existing providers
        const updated = { ...currentProviders, [providerId]: secureConfig };

        // Save to DB
        const saved = await db
            .update(userSettings)
            .set({ aiProviders: updated, updatedAt: new Date() })
            .where(eq(userSettings.userId, userId))
            .returning();

        // Return public (masked) settings
        return await this.getSettings(userId);
    }

    /**
     * Get AI Preferences
     */
    async getAIPreferences(userId: number): Promise<any> {
        const settings = await this.getSettings(userId);
        return settings.aiPreferences;
    }

    /**
     * Update AI Preferences
     */
    async updateAIPreferences(userId: number, preferences: any): Promise<UserSettings> {
        return await this.updateSettings(userId, { aiPreferences: preferences });
    }
}
// Export singleton instance
export const settingsService = new SettingsService();
