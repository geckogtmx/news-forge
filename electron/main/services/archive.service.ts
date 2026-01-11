import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { runArchives, type RunArchive, type InsertRunArchive } from '../db/schema';

/**
 * ArchiveService - Handles all run archive-related database operations
 */
export class ArchiveService {
    /**
     * Create a new archive record
     */
    async createArchive(data: Omit<InsertRunArchive, 'id' | 'archivedAt'>): Promise<RunArchive> {
        const result = await db.insert(runArchives).values(data).returning();
        return result[0];
    }

    /**
     * Get archive by ID
     */
    async getArchiveById(id: number): Promise<RunArchive | undefined> {
        const result = await db.select().from(runArchives).where(eq(runArchives.id, id));
        return result[0];
    }

    /**
     * Get all archives for a user
     */
    async getArchivesByUser(userId: number): Promise<RunArchive[]> {
        return await db
            .select()
            .from(runArchives)
            .where(eq(runArchives.userId, userId))
            .orderBy(desc(runArchives.archivedAt));
    }

    /**
     * Get archive by run ID
     */
    async getArchiveByRun(runId: number): Promise<RunArchive | undefined> {
        const result = await db.select().from(runArchives).where(eq(runArchives.runId, runId)).limit(1);
        return result[0];
    }

    /**
     * Update archive
     */
    async updateArchive(
        id: number,
        data: Partial<Omit<RunArchive, 'id' | 'runId' | 'userId' | 'archivedAt'>>
    ): Promise<RunArchive | undefined> {
        const result = await db.update(runArchives).set(data).where(eq(runArchives.id, id)).returning();
        return result[0];
    }

    /**
     * Update Obsidian export path
     */
    async updateObsidianPath(id: number, path: string): Promise<RunArchive | undefined> {
        const result = await db
            .update(runArchives)
            .set({ obsidianExportPath: path })
            .where(eq(runArchives.id, id))
            .returning();
        return result[0];
    }

    /**
     * Delete archive
     */
    async deleteArchive(id: number): Promise<boolean> {
        const result = await db.delete(runArchives).where(eq(runArchives.id, id)).returning();
        return result.length > 0;
    }

    /**
     * Count archives by user
     */
    async countArchivesByUser(userId: number): Promise<number> {
        const archives = await this.getArchivesByUser(userId);
        return archives.length;
    }

    /**
     * Get archives with Obsidian export
     */
    async getArchivesWithObsidianExport(userId: number): Promise<RunArchive[]> {
        const archives = await this.getArchivesByUser(userId);
        return archives.filter((archive) => archive.obsidianExportPath !== null);
    }

    /**
     * Get recent archives
     */
    async getRecentArchives(userId: number, limit: number = 10): Promise<RunArchive[]> {
        return await db
            .select()
            .from(runArchives)
            .where(eq(runArchives.userId, userId))
            .orderBy(desc(runArchives.archivedAt))
            .limit(limit);
    }

    /**
     * Check if run is archived
     */
    async isRunArchived(runId: number): Promise<boolean> {
        const archive = await this.getArchiveByRun(runId);
        return !!archive;
    }

    /**
     * Get archived data for a run
     */
    async getArchivedData(runId: number): Promise<any | null> {
        const archive = await this.getArchiveByRun(runId);
        if (!archive) return null;
        return archive.archivedData;
    }

    /**
     * Update archived data
     */
    async updateArchivedData(id: number, data: any): Promise<RunArchive | undefined> {
        const result = await db
            .update(runArchives)
            .set({ archivedData: data })
            .where(eq(runArchives.id, id))
            .returning();
        return result[0];
    }
}

// Export singleton instance
export const archiveService = new ArchiveService();
