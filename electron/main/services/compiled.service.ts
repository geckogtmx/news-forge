import { eq, and, desc, inArray } from 'drizzle-orm';
import { db } from '../db';
import { compiledItems, type CompiledItem, type InsertCompiledItem } from '../db/schema';

/**
 * CompiledItemService - Handles all compiled item-related database operations
 */
export class CompiledItemService {
    /**
     * Create a new compiled item
     */
    async createCompiledItem(data: Omit<InsertCompiledItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompiledItem> {
        const result = await db.insert(compiledItems).values(data).returning();
        return result[0];
    }

    /**
     * Get compiled item by ID
     */
    async getCompiledItemById(id: number): Promise<CompiledItem | undefined> {
        const result = await db.select().from(compiledItems).where(eq(compiledItems.id, id));
        return result[0];
    }

    /**
     * Get all compiled items for a run
     */
    async getCompiledItemsByRun(runId: number): Promise<CompiledItem[]> {
        return await db
            .select()
            .from(compiledItems)
            .where(eq(compiledItems.runId, runId))
            .orderBy(desc(compiledItems.createdAt));
    }

    /**
     * Get selected compiled items for a run
     */
    async getSelectedCompiledItems(runId: number): Promise<CompiledItem[]> {
        return await db
            .select()
            .from(compiledItems)
            .where(and(eq(compiledItems.runId, runId), eq(compiledItems.isSelected, true)))
            .orderBy(desc(compiledItems.createdAt));
    }

    /**
     * Update compiled item
     */
    async updateCompiledItem(
        id: number,
        data: Partial<Omit<CompiledItem, 'id' | 'runId' | 'createdAt'>>
    ): Promise<CompiledItem | undefined> {
        const result = await db
            .update(compiledItems)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(compiledItems.id, id))
            .returning();
        return result[0];
    }

    /**
     * Toggle compiled item selection
     */
    async toggleSelection(id: number, selected: boolean): Promise<CompiledItem | undefined> {
        const result = await db
            .update(compiledItems)
            .set({ isSelected: selected, updatedAt: new Date() })
            .where(eq(compiledItems.id, id))
            .returning();
        return result[0];
    }

    /**
     * Delete compiled item
     */
    async deleteCompiledItem(id: number): Promise<boolean> {
        const result = await db.delete(compiledItems).where(eq(compiledItems.id, id)).returning();
        return result.length > 0;
    }

    /**
     * Delete all compiled items for a run
     */
    async deleteCompiledItemsByRun(runId: number): Promise<number> {
        const result = await db.delete(compiledItems).where(eq(compiledItems.runId, runId)).returning();
        return result.length;
    }

    /**
     * Get related headline IDs for a compiled item
     */
    async getRelatedHeadlineIds(id: number): Promise<number[]> {
        const item = await this.getCompiledItemById(id);
        if (!item) return [];

        // sourceHeadlineIds is stored as JSON array
        return item.sourceHeadlineIds as number[];
    }

    /**
     * Count compiled items for a run
     */
    async countCompiledItemsByRun(runId: number): Promise<number> {
        const items = await this.getCompiledItemsByRun(runId);
        return items.length;
    }

    /**
     * Get compiled items by IDs
     */
    async getCompiledItemsByIds(ids: number[]): Promise<CompiledItem[]> {
        if (ids.length === 0) return [];
        return await db.select().from(compiledItems).where(inArray(compiledItems.id, ids));
    }

    /**
     * Bulk create compiled items
     */
    async bulkCreateCompiledItems(
        items: Omit<InsertCompiledItem, 'id' | 'createdAt' | 'updatedAt'>[]
    ): Promise<CompiledItem[]> {
        if (items.length === 0) return [];
        const result = await db.insert(compiledItems).values(items).returning();
        return result;
    }

    /**
     * Search compiled items by topic or summary
     */
    async searchCompiledItems(runId: number, query: string): Promise<CompiledItem[]> {
        const items = await this.getCompiledItemsByRun(runId);
        const lowercaseQuery = query.toLowerCase();

        return items.filter((item) => {
            return (
                item.topic.toLowerCase().includes(lowercaseQuery) ||
                item.summary.toLowerCase().includes(lowercaseQuery) ||
                item.hook.toLowerCase().includes(lowercaseQuery)
            );
        });
    }

    /**
     * Update source headline IDs for a compiled item
     */
    async updateSourceHeadlineIds(id: number, headlineIds: number[]): Promise<CompiledItem | undefined> {
        const result = await db
            .update(compiledItems)
            .set({ sourceHeadlineIds: headlineIds, updatedAt: new Date() })
            .where(eq(compiledItems.id, id))
            .returning();
        return result[0];
    }

    /**
     * Get all compiled items (for admin or analytics)
     */
    async getAllCompiledItems(limit: number = 100): Promise<CompiledItem[]> {
        return await db
            .select()
            .from(compiledItems)
            .orderBy(desc(compiledItems.createdAt))
            .limit(limit);
    }
}

// Export singleton instance
export const compiledItemService = new CompiledItemService();
