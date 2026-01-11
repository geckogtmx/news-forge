import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import { newsSources, type NewsSource, type InsertNewsSource } from '../db/schema';

/**
 * NewsSourceService - Handles all news source-related database operations
 */
export class NewsSourceService {
    /**
     * Create a new news source
     */
    async createSource(data: Omit<InsertNewsSource, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsSource> {
        const result = await db.insert(newsSources).values(data).returning();
        return result[0];
    }

    /**
     * Get source by ID
     */
    async getSourceById(id: number): Promise<NewsSource | undefined> {
        const result = await db.select().from(newsSources).where(eq(newsSources.id, id));
        return result[0];
    }

    /**
     * Get all sources for a user
     */
    async getSourcesByUser(userId: number): Promise<NewsSource[]> {
        return await db.select().from(newsSources).where(eq(newsSources.userId, userId));
    }

    /**
     * Get only active sources for a user
     */
    async getActiveSourcesByUser(userId: number): Promise<NewsSource[]> {
        return await db
            .select()
            .from(newsSources)
            .where(and(eq(newsSources.userId, userId), eq(newsSources.isActive, true)));
    }

    /**
     * Get sources by type for a user
     */
    async getSourcesByType(userId: number, type: 'rss' | 'gmail' | 'youtube' | 'website'): Promise<NewsSource[]> {
        return await db
            .select()
            .from(newsSources)
            .where(and(eq(newsSources.userId, userId), eq(newsSources.type, type)));
    }

    /**
     * Update source configuration
     */
    async updateSource(
        id: number,
        data: Partial<Omit<NewsSource, 'id' | 'userId' | 'createdAt'>>
    ): Promise<NewsSource | undefined> {
        const result = await db
            .update(newsSources)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(newsSources.id, id))
            .returning();
        return result[0];
    }

    /**
     * Toggle source active status
     */
    async toggleSourceActive(id: number, isActive: boolean): Promise<NewsSource | undefined> {
        const result = await db
            .update(newsSources)
            .set({ isActive, updatedAt: new Date() })
            .where(eq(newsSources.id, id))
            .returning();
        return result[0];
    }

    /**
     * Delete a news source
     */
    async deleteSource(id: number): Promise<boolean> {
        const result = await db.delete(newsSources).where(eq(newsSources.id, id)).returning();
        return result.length > 0;
    }

    /**
     * Count sources by user
     */
    async countSourcesByUser(userId: number): Promise<number> {
        const sources = await this.getSourcesByUser(userId);
        return sources.length;
    }

    /**
     * Count active sources by user
     */
    async countActiveSourcesByUser(userId: number): Promise<number> {
        const sources = await this.getActiveSourcesByUser(userId);
        return sources.length;
    }

    /**
     * Bulk toggle sources
     */
    async bulkToggleSources(sourceIds: number[], isActive: boolean): Promise<number> {
        let count = 0;
        for (const id of sourceIds) {
            const result = await this.toggleSourceActive(id, isActive);
            if (result) count++;
        }
        return count;
    }

    /**
     * Validate source configuration based on type
     */
    validateSourceConfig(type: NewsSource['type'], config: any): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        switch (type) {
            case 'rss':
                if (!config.url) errors.push('RSS feed URL is required');
                break;
            case 'gmail':
                if (!config.filters) errors.push('Gmail filters are required');
                break;
            case 'youtube':
                if (!config.channelId && !config.channelUrl) {
                    errors.push('YouTube channel ID or URL is required');
                }
                break;
            case 'website':
                if (!config.url) errors.push('Website URL is required');
                if (!config.selectors) errors.push('CSS selectors are required');
                break;
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }
}

// Export singleton instance
export const newsSourceService = new NewsSourceService();
