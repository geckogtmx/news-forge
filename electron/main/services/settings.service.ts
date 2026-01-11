import { eq } from 'drizzle-orm';
import { db } from '../db';
import { userSettings, type UserSettings, type InsertUserSettings } from '../db/schema';

/**
 * SettingsService - Handles all user settings-related database operations
 */
export class SettingsService {
    /**
     * Get or create settings for a user
     */
    async getSettings(userId: number): Promise<UserSettings> {
        let result = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);

        // If settings don't exist, create default settings
        if (result.length === 0) {
            const defaultSettings = await this.createDefaultSettings(userId);
            return defaultSettings;
        }

        return result[0];
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
}

// Export singleton instance
export const settingsService = new SettingsService();
