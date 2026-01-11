import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { contentPackages, type ContentPackage, type InsertContentPackage } from '../db/schema';

/**
 * ContentPackageService - Handles all content package-related database operations
 */
export class ContentPackageService {
    /**
     * Create a new content package
     */
    async createPackage(
        data: Omit<InsertContentPackage, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<ContentPackage> {
        const result = await db.insert(contentPackages).values(data).returning();
        return result[0];
    }

    /**
     * Get content package by ID
     */
    async getPackageById(id: number): Promise<ContentPackage | undefined> {
        const result = await db.select().from(contentPackages).where(eq(contentPackages.id, id));
        return result[0];
    }

    /**
     * Get all content packages for a run
     */
    async getPackagesByRun(runId: number): Promise<ContentPackage[]> {
        return await db
            .select()
            .from(contentPackages)
            .where(eq(contentPackages.runId, runId))
            .orderBy(desc(contentPackages.createdAt));
    }

    /**
     * Get content package by compiled item
     */
    async getPackageByCompiledItem(compiledItemId: number): Promise<ContentPackage | undefined> {
        const result = await db
            .select()
            .from(contentPackages)
            .where(eq(contentPackages.compiledItemId, compiledItemId))
            .limit(1);
        return result[0];
    }

    /**
     * Get packages by status
     */
    async getPackagesByStatus(
        runId: number,
        status: ContentPackage['status']
    ): Promise<ContentPackage[]> {
        return await db
            .select()
            .from(contentPackages)
            .where(and(eq(contentPackages.runId, runId), eq(contentPackages.status, status)))
            .orderBy(desc(contentPackages.createdAt));
    }

    /**
     * Update content package
     */
    async updatePackage(
        id: number,
        data: Partial<Omit<ContentPackage, 'id' | 'runId' | 'compiledItemId' | 'createdAt'>>
    ): Promise<ContentPackage | undefined> {
        const result = await db
            .update(contentPackages)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(contentPackages.id, id))
            .returning();
        return result[0];
    }

    /**
     * Mark package as exported
     */
    async markPackageExported(id: number): Promise<ContentPackage | undefined> {
        const result = await db
            .update(contentPackages)
            .set({ status: 'exported', updatedAt: new Date() })
            .where(eq(contentPackages.id, id))
            .returning();
        return result[0];
    }

    /**
     * Mark package as ready
     */
    async markPackageReady(id: number): Promise<ContentPackage | undefined> {
        const result = await db
            .update(contentPackages)
            .set({ status: 'ready', updatedAt: new Date() })
            .where(eq(contentPackages.id, id))
            .returning();
        return result[0];
    }

    /**
     * Delete content package
     */
    async deletePackage(id: number): Promise<boolean> {
        const result = await db.delete(contentPackages).where(eq(contentPackages.id, id)).returning();
        return result.length > 0;
    }

    /**
     * Delete all packages for a run
     */
    async deletePackagesByRun(runId: number): Promise<number> {
        const result = await db.delete(contentPackages).where(eq(contentPackages.runId, runId)).returning();
        return result.length;
    }

    /**
     * Count packages by run
     */
    async countPackagesByRun(runId: number): Promise<number> {
        const packages = await this.getPackagesByRun(runId);
        return packages.length;
    }

    /**
     * Count packages by status
     */
    async countPackagesByStatus(runId: number, status: ContentPackage['status']): Promise<number> {
        const packages = await this.getPackagesByStatus(runId, status);
        return packages.length;
    }

    /**
     * Get ready packages (ready for export)
     */
    async getReadyPackages(runId: number): Promise<ContentPackage[]> {
        return await this.getPackagesByStatus(runId, 'ready');
    }

    /**
     * Get exported packages
     */
    async getExportedPackages(runId: number): Promise<ContentPackage[]> {
        return await this.getPackagesByStatus(runId, 'exported');
    }

    /**
     * Bulk create packages
     */
    async bulkCreatePackages(
        packages: Omit<InsertContentPackage, 'id' | 'createdAt' | 'updatedAt'>[]
    ): Promise<ContentPackage[]> {
        if (packages.length === 0) return [];
        const result = await db.insert(contentPackages).values(packages).returning();
        return result;
    }

    /**
     * Update package content (title, description, outline)
     */
    async updatePackageContent(
        id: number,
        content: {
            youtubeTitle?: string;
            youtubeDescription?: string;
            scriptOutline?: string;
        }
    ): Promise<ContentPackage | undefined> {
        const result = await db
            .update(contentPackages)
            .set({ ...content, updatedAt: new Date() })
            .where(eq(contentPackages.id, id))
            .returning();
        return result[0];
    }

    /**
     * Get all packages (for admin or analytics)
     */
    async getAllPackages(limit: number = 100): Promise<ContentPackage[]> {
        return await db
            .select()
            .from(contentPackages)
            .orderBy(desc(contentPackages.createdAt))
            .limit(limit);
    }
}

// Export singleton instance
export const contentPackageService = new ContentPackageService();
