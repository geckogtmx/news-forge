import { newsSourceService } from './source.service';
import { runService } from './run.service';
import { headlineService } from './headline.service';
import { progressService } from './progress.service';
import { rssService } from './rss.service';
import { gmailService } from './gmail.service';
import { arxivService } from './arxiv.service';
import { huggingFaceService } from './huggingface.service';
import type { NewsSource, InsertRawHeadline } from '../db/schema';

/**
 * Result of fetching from a single source
 */
export interface SourceResult {
    sourceId: number;
    sourceName: string;
    sourceType: string;
    success: boolean;
    headlineCount: number;
    error?: string;
}

/**
 * Result of a complete fetch run
 */
export interface RunResult {
    runId: number;
    totalSources: number;
    successfulSources: number;
    failedSources: number;
    totalHeadlines: number;
    errors: SourceError[];
    duration: number;
}

/**
 * Error details for a failed source
 */
export interface SourceError {
    sourceId: number;
    sourceName: string;
    sourceType: string;
    error: string;
}

/**
 * Fetch Coordinator Service
 * 
 * Orchestrates parallel content fetching from all active sources,
 * handles errors gracefully, and aggregates results.
 */
export class FetchCoordinatorService {
    /**
     * Run fetch for all active sources for a user
     * 
     * @param userId - User ID to fetch sources for
     * @returns RunResult with statistics and errors
     */
    async runFetchForAllSources(userId: number): Promise<RunResult> {
        const startTime = Date.now();
        console.log(`[FetchCoordinator] Starting fetch for user ${userId}`);

        // Create a new run
        const run = await runService.createRun(userId);
        const runId = run.id;

        // Get all active sources
        const sources = await newsSourceService.getActiveSourcesByUser(userId);
        const totalSources = sources.length;

        console.log(`[FetchCoordinator] Found ${totalSources} active sources for run ${runId}`);

        if (totalSources === 0) {
            await runService.completeRun(runId, {
                totalSources: 0,
                successfulSources: 0,
                failedSources: 0,
                totalHeadlines: 0,
            });

            return {
                runId,
                totalSources: 0,
                successfulSources: 0,
                failedSources: 0,
                totalHeadlines: 0,
                errors: [],
                duration: Date.now() - startTime,
            };
        }

        // Emit initial progress
        this.emitProgress(runId, 0, totalSources, 'Starting...');

        // Fetch from all sources in parallel with error isolation
        const results = await Promise.allSettled(
            sources.map(source => this.fetchFromSource(source, runId))
        );

        // Process results
        const sourceResults: SourceResult[] = [];
        const errors: SourceError[] = [];
        let totalHeadlines = 0;
        let successfulSources = 0;

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                sourceResults.push(result.value);
                if (result.value.success) {
                    successfulSources++;
                    totalHeadlines += result.value.headlineCount;
                } else {
                    errors.push({
                        sourceId: result.value.sourceId,
                        sourceName: result.value.sourceName,
                        sourceType: result.value.sourceType,
                        error: result.value.error || 'Unknown error',
                    });
                }
            } else {
                // Promise was rejected (should be rare with our error handling)
                const source = sources[index];
                errors.push({
                    sourceId: source.id,
                    sourceName: source.name,
                    sourceType: source.type,
                    error: result.reason?.message || 'Promise rejected',
                });
            }
        });

        const failedSources = totalSources - successfulSources;
        const duration = Date.now() - startTime;

        // Update run status
        await runService.completeRun(runId, {
            totalSources,
            successfulSources,
            failedSources,
            totalHeadlines,
            duration,
            errors: errors.length > 0 ? errors : undefined,
        });

        // Emit completion progress
        this.emitProgress(runId, totalSources, totalSources, 'Completed');

        console.log(`[FetchCoordinator] Run ${runId} completed: ${successfulSources}/${totalSources} sources successful, ${totalHeadlines} headlines in ${duration}ms`);

        return {
            runId,
            totalSources,
            successfulSources,
            failedSources,
            totalHeadlines,
            errors,
            duration,
        };
    }

    /**
     * Fetch from a single source with error handling
     * 
     * @param source - News source to fetch from
     * @param runId - Current run ID
     * @returns SourceResult with fetch outcome
     */
    private async fetchFromSource(source: NewsSource, runId: number): Promise<SourceResult> {
        const { id: sourceId, name: sourceName, type: sourceType } = source;

        console.log(`[FetchCoordinator] Fetching from source: ${sourceName} (${sourceType})`);

        // Emit progress for this source
        this.emitProgress(runId, null, null, `Fetching from ${sourceName}...`);

        try {
            // Route to appropriate fetcher based on source type
            const headlines = await this.fetchByType(source, runId);

            // Save headlines to database
            if (headlines.length > 0) {
                await headlineService.createHeadlines(headlines);
            }

            console.log(`[FetchCoordinator] ✓ ${sourceName}: ${headlines.length} headlines`);

            return {
                sourceId,
                sourceName,
                sourceType,
                success: true,
                headlineCount: headlines.length,
            };

        } catch (error: any) {
            console.error(`[FetchCoordinator] ✗ ${sourceName} failed:`, error.message);

            return {
                sourceId,
                sourceName,
                sourceType,
                success: false,
                headlineCount: 0,
                error: error.message || 'Unknown error occurred',
            };
        }
    }

    /**
     * Route to appropriate fetcher based on source type
     */
    private async fetchByType(
        source: NewsSource,
        runId: number
    ): Promise<Omit<InsertRawHeadline, 'id' | 'createdAt'>[]> {
        switch (source.type) {
            case 'rss':
                return this.fetchFromRss(source, runId);
            case 'gmail':
                return this.fetchFromGmail(source, runId);
            case 'arxiv':
                return this.fetchFromArxiv(source, runId);
            case 'huggingface':
                return this.fetchFromHuggingFace(source, runId);
            // Note: YouTube videos are added manually via the Run page, not fetched
            default:
                throw new Error(`Unknown source type: ${source.type}`);
        }
    }

    /**
     * Fetch from RSS feed source
     */
    private async fetchFromRss(
        source: NewsSource,
        runId: number
    ): Promise<Omit<InsertRawHeadline, 'id' | 'createdAt'>[]> {
        const config = typeof source.config === 'string' ? JSON.parse(source.config) : source.config;
        const url = config.url;

        if (!url) {
            throw new Error('RSS source missing URL in config');
        }

        // Fetch and parse feed
        const feed = await rssService.fetchFeed(url);

        // Extract headlines
        const headlines = rssService.extractHeadlines(feed, runId, source.id);

        return headlines;
    }

    /**
     * Fetch from Gmail source
     */
    private async fetchFromGmail(
        source: NewsSource,
        runId: number
    ): Promise<Omit<InsertRawHeadline, 'id' | 'createdAt'>[]> {
        const config = typeof source.config === 'string' ? JSON.parse(source.config) : source.config;
        const filters = config.filters || {};

        // Fetch newsletters
        const emails = await gmailService.fetchNewsletters(source.userId, filters);

        // Extract headlines
        const gmailHeadlines = gmailService.extractHeadlines(emails);

        // Convert to standard headline format
        return gmailHeadlines.map(headline => ({
            runId,
            sourceId: source.id,
            title: headline.title,
            description: headline.description,
            url: headline.url,
            publishedAt: headline.publishedAt,
            source: 'gmail' as const,
            isSelected: false,
        }));
    }

    /**
     * Fetch from ArXiv source
     */
    private async fetchFromArxiv(
        source: NewsSource,
        runId: number
    ): Promise<Omit<InsertRawHeadline, 'id' | 'createdAt'>[]> {
        const config = typeof source.config === 'string' ? JSON.parse(source.config) : source.config;
        const category = config.category || 'cs.AI';
        const maxResults = config.maxResults || 20;

        // Fetch papers
        const papers = await arxivService.fetchRecentPapers(category, maxResults);

        // Convert to headline format
        return papers.map(paper => ({
            runId,
            sourceId: source.id,
            title: paper.title,
            description: paper.summary,
            url: paper.link,
            publishedAt: new Date(paper.published),
            source: 'arxiv' as const,
            isSelected: false,
        }));
    }

    /**
     * Fetch from Hugging Face source
     */
    private async fetchFromHuggingFace(
        source: NewsSource,
        runId: number
    ): Promise<Omit<InsertRawHeadline, 'id' | 'createdAt'>[]> {
        // Fetch daily papers
        const papers = await huggingFaceService.fetchDailyPapers();

        // Convert to headline format
        return papers.map((paper: any) => ({
            runId,
            sourceId: source.id,
            title: paper.title,
            description: paper.summary || '',
            url: paper.url,
            publishedAt: new Date(paper.publishedAt || Date.now()),
            source: 'huggingface' as const,
            isSelected: false,
        }));
    }

    /**
     * Emit progress event
     */
    private emitProgress(
        runId: number,
        current: number | null,
        total: number | null,
        message: string
    ): void {
        const progress = current !== null && total !== null && total > 0
            ? Math.round((current / total) * 100)
            : 0;

        progressService.sendRunProgress({
            runId,
            current: current ?? 0,
            total: total ?? 0,
            progress,
            message,
        });
    }
}

// Export singleton instance
export const fetchCoordinatorService = new FetchCoordinatorService();
