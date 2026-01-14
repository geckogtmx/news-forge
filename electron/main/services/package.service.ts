import { aiRegistry } from './ai/ai.registry';
import { settingsService } from './settings.service';
import { compiledItemService } from './compiled.service';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../db';
import { contentPackages, type ContentPackage, type InsertContentPackage } from '../db/schema';

/**
 * ContentPackageService - Handles all content package-related database operations
 */
export class ContentPackageService {
    // ... existing methods ...

    /**
     * Generate content for a package using AI
     */
    async generatePackageContent(
        packageId: number,
        userId: number,
        modelId?: string,
        providerId?: string
    ): Promise<{ pkg: ContentPackage; usage: { tokens: number; cost: number } }> {
        // 1. Get package and compiled item
        const pkg = await this.getPackageById(packageId);
        if (!pkg) throw new Error(`Package ${packageId} not found`);

        const compiledItem = await compiledItemService.getCompiledItemById(pkg.compiledItemId);
        if (!compiledItem) throw new Error(`Compiled item ${pkg.compiledItemId} not found`);

        // 2. Get settings and API keys
        const settings = await settingsService.getSecureSettings(userId);
        const aiPreferences = settings?.aiPreferences as any;
        const aiProviders = settings?.aiProviders as any;

        const selectedModel = modelId || aiPreferences?.defaultModel || 'claude-3.5-sonnet';
        const selectedProvider = providerId || 'anthropic';

        let apiKey = undefined;
        if (aiProviders && aiProviders[selectedProvider]) {
            apiKey = aiProviders[selectedProvider].apiKey;
        }

        // 3. Build Prompt
        const prompt = `
You are a professional YouTube Content Strategist.
Your task is to turn the following news summary into high-performing YouTube content assets.

Topic: ${compiledItem.topic}
Hook: ${compiledItem.hook}
Summary: ${compiledItem.summary}

Please generate:
1. A click-worthy YouTube Title (max 60 chars)
2. An engaging YouTube Description (with timestamps placeholder)
3. A structured Script Outline (Hook, Core Content, Conclusion)

Format your response as a JSON object:
{
  "youtubeTitle": "string",
  "youtubeDescription": "string",
  "scriptOutline": "string"
}
`;

        // 4. Call AI
        const response = await aiRegistry.generate(
            {
                modelId: selectedModel,
                prompt,
                systemPrompt: "You are an expert YouTube strategist. Output strictly JSON.",
                temperature: 0.7,
                apiKey
            },
            selectedProvider
        );

        // 5. Parse Response
        let content;
        try {
            let clean = response.content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            // Finding the first { and last } to handle markdown wrapper text
            const firstBrace = clean.indexOf('{');
            const lastBrace = clean.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                clean = clean.substring(firstBrace, lastBrace + 1);
            }
            content = JSON.parse(clean);
        } catch (e) {
            console.error("Failed to parse AI response", e);
            throw new Error("AI response was not valid JSON");
        }

        // 6. Update Package
        const updatedPkg = await this.updatePackageContent(packageId, content);
        if (!updatedPkg) throw new Error("Failed to update package");

        // 7. Calculate Cost (Simplistic)
        const tokens = response.usage?.totalTokens || 0;
        const cost = 0; // TODO: Implement cost calc

        return { pkg: updatedPkg, usage: { tokens, cost } };
    }

    /**
     * Create a new content package
     */
    async createPackage(
        data: Omit<InsertContentPackage, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<ContentPackage> {
        const result = await db.insert(contentPackages).values(data).returning();
        return result[0];
    }
    // ... rest of class ...


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
