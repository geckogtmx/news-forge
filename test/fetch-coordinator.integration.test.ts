import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchCoordinatorService } from '../electron/main/services/fetch-coordinator.service';
import { newsSourceService } from '../electron/main/services/source.service';
import { runService } from '../electron/main/services/run.service';
import { rssService } from '../electron/main/services/rss.service';
import { headlineService } from '../electron/main/services/headline.service';

// Mock DB module to prevent native binding errors
vi.mock('../electron/main/db/index', () => ({
    db: {},
    sqlite: {}
}));

// Mock dependencies
vi.mock('../electron/main/services/source.service', () => ({
    newsSourceService: {
        getActiveSourcesByUser: vi.fn()
    }
}));

vi.mock('../electron/main/services/run.service', () => ({
    runService: {
        createRun: vi.fn(),
        completeRun: vi.fn()
    }
}));

vi.mock('../electron/main/services/rss.service', () => ({
    rssService: {
        fetchFeed: vi.fn(),
        extractHeadlines: vi.fn()
    }
}));

vi.mock('../electron/main/services/headline.service', () => ({
    headlineService: {
        createHeadlines: vi.fn()
    }
}));

vi.mock('../electron/main/services/progress.service', () => ({
    progressService: {
        sendRunProgress: vi.fn()
    }
}));

describe('FetchCoordinatorService Integration', () => {
    const userId = 1;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should skip fetch if no active sources found', async () => {
        // Setup mocks
        vi.mocked(newsSourceService.getActiveSourcesByUser).mockResolvedValue([]);
        vi.mocked(runService.createRun).mockResolvedValue({ id: 999 } as any);

        // Execute
        const result = await fetchCoordinatorService.runFetchForAllSources(userId);

        // Verify
        expect(result.totalSources).toBe(0);
        expect(runService.createRun).toHaveBeenCalledWith(userId);
        expect(newsSourceService.getActiveSourcesByUser).toHaveBeenCalledWith(userId);
        expect(runService.completeRun).toHaveBeenCalledWith(999, expect.objectContaining({
            totalSources: 0
        }));
    });

    it('should fetch from multiple sources in parallel', async () => {
        // Setup mocks
        const mockSources = [
            { id: 1, type: 'rss', config: JSON.stringify({ url: 'http://rss1.com' }), name: 'RSS 1' },
            { id: 2, type: 'rss', config: JSON.stringify({ url: 'http://rss2.com' }), name: 'RSS 2' }
        ] as any[];

        vi.mocked(newsSourceService.getActiveSourcesByUser).mockResolvedValue(mockSources);
        vi.mocked(runService.createRun).mockResolvedValue({ id: 100 } as any);

        // Mock RSS fetch success
        vi.mocked(rssService.fetchFeed).mockResolvedValue({} as any);
        vi.mocked(rssService.extractHeadlines).mockReturnValue([
            { title: 'Headline 1' } as any,
            { title: 'Headline 2' } as any
        ]);

        // Execute
        const result = await fetchCoordinatorService.runFetchForAllSources(userId);

        // Verify
        expect(result.totalSources).toBe(2);
        expect(result.successfulSources).toBe(2);
        expect(result.failedSources).toBe(0);
        expect(rssService.fetchFeed).toHaveBeenCalledTimes(2);
        expect(headlineService.createHeadlines).toHaveBeenCalledTimes(2);
    });

    it('should handle partial failures gracefully', async () => {
        // Setup mocks: 1 failing source, 1 successful source
        const mockSources = [
            { id: 1, type: 'rss', config: JSON.stringify({ url: 'http://fail.com' }), name: 'Fail RSS' },
            { id: 2, type: 'rss', config: JSON.stringify({ url: 'http://ok.com' }), name: 'OK RSS' }
        ] as any[];

        vi.mocked(newsSourceService.getActiveSourcesByUser).mockResolvedValue(mockSources);
        vi.mocked(runService.createRun).mockResolvedValue({ id: 101 } as any);

        // Fail first source, succeed second
        vi.mocked(rssService.fetchFeed).mockImplementation(async (url) => {
            if (url === 'http://fail.com') throw new Error('Network Error');
            return {} as any;
        });
        vi.mocked(rssService.extractHeadlines).mockReturnValue([{ title: 'OK Item' } as any]);

        // Execute
        const result = await fetchCoordinatorService.runFetchForAllSources(userId);

        // Verify
        expect(result.totalSources).toBe(2);
        expect(result.successfulSources).toBe(1);
        expect(result.failedSources).toBe(1);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0].sourceName).toBe('Fail RSS');
    });
});
