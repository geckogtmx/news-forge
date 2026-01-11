import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { runs, type Run, type InsertRun } from '../db/schema';

/**
 * RunService - Handles all run-related database operations
 */
export class RunService {
    /**
     * Create a new run
     */
    async createRun(userId: number, stats: any = {}): Promise<Run> {
        const result = await db
            .insert(runs)
            .values({
                userId,
                status: 'draft',
                stats,
            })
            .returning();
        return result[0];
    }

    /**
     * Get run by ID
     */
    async getRunById(id: number): Promise<Run | undefined> {
        const result = await db.select().from(runs).where(eq(runs.id, id));
        return result[0];
    }

    /**
     * Get all runs for a user with pagination
     */
    async getRunsByUser(userId: number, limit: number = 50, offset: number = 0): Promise<Run[]> {
        return await db
            .select()
            .from(runs)
            .where(eq(runs.userId, userId))
            .orderBy(desc(runs.createdAt))
            .limit(limit)
            .offset(offset);
    }

    /**
     * Get runs by status
     */
    async getRunsByStatus(
        userId: number,
        status: Run['status']
    ): Promise<Run[]> {
        return await db
            .select()
            .from(runs)
            .where(and(eq(runs.userId, userId), eq(runs.status, status)))
            .orderBy(desc(runs.createdAt));
    }

    /**
     * Get the most recent run for a user
     */
    async getLatestRun(userId: number): Promise<Run | undefined> {
        const result = await db
            .select()
            .from(runs)
            .where(eq(runs.userId, userId))
            .orderBy(desc(runs.createdAt))
            .limit(1);
        return result[0];
    }

    /**
     * Update run status
     */
    async updateRunStatus(id: number, status: Run['status']): Promise<Run | undefined> {
        const updates: any = { status, updatedAt: new Date() };

        // If completing or archiving, set completedAt
        if (status === 'completed' || status === 'archived') {
            updates.completedAt = new Date();
        }

        const result = await db.update(runs).set(updates).where(eq(runs.id, id)).returning();
        return result[0];
    }

    /**
     * Update run statistics
     */
    async updateRunStats(id: number, stats: any): Promise<Run | undefined> {
        const result = await db
            .update(runs)
            .set({ stats, updatedAt: new Date() })
            .where(eq(runs.id, id))
            .returning();
        return result[0];
    }

    /**
     * Mark run as complete with final metadata
     */
    async completeRun(id: number, finalStats?: any): Promise<Run | undefined> {
        const updates: any = {
            status: 'completed',
            completedAt: new Date(),
            updatedAt: new Date(),
        };

        if (finalStats) {
            updates.stats = finalStats;
        }

        const result = await db.update(runs).set(updates).where(eq(runs.id, id)).returning();
        return result[0];
    }

    /**
     * Mark run as failed with error details
     */
    async failRun(id: number, error: string): Promise<Run | undefined> {
        // Get current stats and add error
        const currentRun = await this.getRunById(id);
        if (!currentRun) return undefined;

        const stats = {
            ...currentRun.stats,
            error,
            failedAt: new Date().toISOString(),
        };

        const result = await db
            .update(runs)
            .set({
                status: 'draft', // Reset to draft so user can retry
                stats,
                updatedAt: new Date(),
            })
            .where(eq(runs.id, id))
            .returning();
        return result[0];
    }

    /**
     * Get run statistics (headline counts, etc.)
     */
    async getRunStatistics(id: number): Promise<{
        totalHeadlines: number;
        selectedHeadlines: number;
        compiledItems: number;
        contentPackages: number;
    }> {
        const run = await this.getRunById(id);
        if (!run) {
            return {
                totalHeadlines: 0,
                selectedHeadlines: 0,
                compiledItems: 0,
                contentPackages: 0,
            };
        }

        return {
            totalHeadlines: run.stats?.totalHeadlines || 0,
            selectedHeadlines: run.stats?.selectedHeadlines || 0,
            compiledItems: run.stats?.compiledItems || 0,
            contentPackages: run.stats?.contentPackages || 0,
        };
    }

    /**
     * Delete a run (and cascading deletes should be handled by the caller)
     */
    async deleteRun(id: number): Promise<boolean> {
        const result = await db.delete(runs).where(eq(runs.id, id)).returning();
        return result.length > 0;
    }

    /**
     * Count runs by user
     */
    async countRunsByUser(userId: number): Promise<number> {
        const allRuns = await this.getRunsByUser(userId, 10000); // Large limit to get all
        return allRuns.length;
    }

    /**
     * Get runs within a date range
     */
    async getRunsByDateRange(userId: number, startDate: Date, endDate: Date): Promise<Run[]> {
        const allRuns = await this.getRunsByUser(userId, 10000);
        return allRuns.filter((run) => {
            const createdAt = run.createdAt;
            return createdAt >= startDate && createdAt <= endDate;
        });
    }

    /**
     * Calculate average run duration
     */
    async getAverageRunDuration(userId: number): Promise<number> {
        const completedRuns = await this.getRunsByStatus(userId, 'completed');
        const durations = completedRuns
            .filter((run) => run.completedAt)
            .map((run) => {
                const start = run.startedAt.getTime();
                const end = run.completedAt!.getTime();
                return end - start;
            });

        if (durations.length === 0) return 0;
        return durations.reduce((a, b) => a + b, 0) / durations.length;
    }
}

// Export singleton instance
export const runService = new RunService();
