import { eq, and, inArray, desc, like, or } from 'drizzle-orm';
import { db } from '../db';
import { rawHeadlines, type RawHeadline, type InsertRawHeadline } from '../db/schema';

/**
 * HeadlineService - Handles all raw headline-related database operations
 */
export class HeadlineService {
    /**
     * Create a single headline
     */
    async createHeadline(data: Omit<InsertRawHeadline, 'id' | 'createdAt'>): Promise<RawHeadline> {
        const result = await db.insert(rawHeadlines).values(data).returning();
        return result[0];
    }

    /**
     * Bulk insert headlines (more efficient for multiple headlines)
     */
    async createHeadlines(headlines: Omit<InsertRawHeadline, 'id' | 'createdAt'>[]): Promise<RawHeadline[]> {
        if (headlines.length === 0) return [];
        const result = await db.insert(rawHeadlines).values(headlines).returning();
        return result;
    }

    /**
     * Get headline by ID
     */
    async getHeadlineById(id: number): Promise<RawHeadline | undefined> {
        const result = await db.select().from(rawHeadlines).where(eq(rawHeadlines.id, id));
        return result[0];
    }

    /**
     * Get all headlines for a run with optional filters
     */
    async getHeadlinesByRun(
        runId: number,
        filters?: {
            sourceId?: number;
            source?: RawHeadline['source'];
            isSelected?: boolean;
            dateFrom?: Date;
            dateTo?: Date;
        }
    ): Promise<RawHeadline[]> {
        let conditions = [eq(rawHeadlines.runId, runId)];

        if (filters?.sourceId) {
            conditions.push(eq(rawHeadlines.sourceId, filters.sourceId));
        }

        if (filters?.source) {
            conditions.push(eq(rawHeadlines.source, filters.source));
        }

        if (filters?.isSelected !== undefined) {
            conditions.push(eq(rawHeadlines.isSelected, filters.isSelected));
        }

        const results = await db
            .select()
            .from(rawHeadlines)
            .where(and(...conditions))
            .orderBy(desc(rawHeadlines.publishedAt));

        // Filter by date range if provided
        if (filters?.dateFrom || filters?.dateTo) {
            return results.filter((headline) => {
                if (!headline.publishedAt) return false;
                const publishedAt = headline.publishedAt;
                if (filters.dateFrom && publishedAt < filters.dateFrom) return false;
                if (filters.dateTo && publishedAt > filters.dateTo) return false;
                return true;
            });
        }

        return results;
    }

    /**
     * Get selected headlines for a run
     */
    async getSelectedHeadlines(runId: number): Promise<RawHeadline[]> {
        return await this.getHeadlinesByRun(runId, { isSelected: true });
    }

    /**
     * Toggle headline selection
     */
    async toggleHeadlineSelection(id: number, selected: boolean): Promise<RawHeadline | undefined> {
        const result = await db
            .update(rawHeadlines)
            .set({ isSelected: selected })
            .where(eq(rawHeadlines.id, id))
            .returning();
        return result[0];
    }

    /**
     * Bulk select headlines
     */
    async bulkSelectHeadlines(ids: number[], selected: boolean): Promise<number> {
        if (ids.length === 0) return 0;

        const result = await db
            .update(rawHeadlines)
            .set({ isSelected: selected })
            .where(inArray(rawHeadlines.id, ids))
            .returning();

        return result.length;
    }

    /**
     * Search headlines by title or description
     */
    async searchHeadlines(runId: number, query: string): Promise<RawHeadline[]> {
        const results = await db
            .select()
            .from(rawHeadlines)
            .where(
                and(
                    eq(rawHeadlines.runId, runId),
                    or(
                        like(rawHeadlines.title, `%${query}%`),
                        like(rawHeadlines.description, `%${query}%`)
                    )
                )
            )
            .orderBy(desc(rawHeadlines.publishedAt));

        return results;
    }

    /**
     * Delete headlines
     */
    async deleteHeadlines(ids: number[]): Promise<number> {
        if (ids.length === 0) return 0;
        const result = await db.delete(rawHeadlines).where(inArray(rawHeadlines.id, ids)).returning();
        return result.length;
    }

    /**
     * Delete all headlines for a run
     */
    async deleteHeadlinesByRun(runId: number): Promise<number> {
        const result = await db.delete(rawHeadlines).where(eq(rawHeadlines.runId, runId)).returning();
        return result.length;
    }

    /**
     * Count headlines for a run
     */
    async countHeadlinesByRun(runId: number): Promise<number> {
        const headlines = await this.getHeadlinesByRun(runId);
        return headlines.length;
    }

    /**
     * Count selected headlines for a run
     */
    async countSelectedHeadlines(runId: number): Promise<number> {
        const selected = await this.getSelectedHeadlines(runId);
        return selected.length;
    }

    /**
     * Get headlines by multiple IDs
     */
    async getHeadlinesByIds(ids: number[]): Promise<RawHeadline[]> {
        if (ids.length === 0) return [];
        return await db.select().from(rawHeadlines).where(inArray(rawHeadlines.id, ids));
    }

    /**
     * Update headline
     */
    async updateHeadline(
        id: number,
        data: Partial<Omit<RawHeadline, 'id' | 'runId' | 'createdAt'>>
    ): Promise<RawHeadline | undefined> {
        const result = await db.update(rawHeadlines).set(data).where(eq(rawHeadlines.id, id)).returning();
        return result[0];
    }

    /**
     * Get headlines by source
     */
    async getHeadlinesBySource(sourceId: number, limit: number = 100): Promise<RawHeadline[]> {
        return await db
            .select()
            .from(rawHeadlines)
            .where(eq(rawHeadlines.sourceId, sourceId))
            .orderBy(desc(rawHeadlines.publishedAt))
            .limit(limit);
    }

    /**
     * Get recent headlines across all runs
     */
    async getRecentHeadlines(limit: number = 50): Promise<RawHeadline[]> {
        return await db
            .select()
            .from(rawHeadlines)
            .orderBy(desc(rawHeadlines.createdAt))
            .limit(limit);
    }
}

// Export singleton instance
export const headlineService = new HeadlineService();
