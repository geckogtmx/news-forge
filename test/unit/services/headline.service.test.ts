import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeadlineService } from '../../../electron/main/services/headline.service';

// Shared mock chain that persists across calls
const mockSelectChain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve([])),
};

const mockInsertChain = {
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve([])),
};

const mockUpdateChain = {
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve([])),
};

const mockDeleteChain = {
    where: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve([])),
};

vi.mock('../../../electron/main/db', () => ({
    db: {
        select: vi.fn(() => mockSelectChain),
        insert: vi.fn(() => mockInsertChain),
        update: vi.fn(() => mockUpdateChain),
        delete: vi.fn(() => mockDeleteChain),
    },
}));

const { db } = await import('../../../electron/main/db');

describe('HeadlineService', () => {
    let service: HeadlineService;

    beforeEach(() => {
        service = new HeadlineService();
        vi.clearAllMocks();
        // Re-establish return chains after clearAllMocks
        mockSelectChain.from.mockReturnThis();
        mockSelectChain.where.mockReturnThis();
        mockSelectChain.orderBy.mockReturnThis();
        mockSelectChain.limit.mockReturnThis();
        mockSelectChain.then.mockImplementation((resolve) => resolve([]));

        mockInsertChain.values.mockReturnThis();
        mockInsertChain.returning.mockReturnThis();
        mockInsertChain.then.mockImplementation((resolve) => resolve([]));

        mockUpdateChain.set.mockReturnThis();
        mockUpdateChain.where.mockReturnThis();
        mockUpdateChain.returning.mockReturnThis();
        mockUpdateChain.then.mockImplementation((resolve) => resolve([]));
    });

    describe('createHeadline', () => {
        it('should insert and return the created headline', async () => {
            const mockHeadline = {
                id: 1,
                runId: 1,
                sourceId: 1,
                title: 'Test headline',
                url: 'https://example.com',
                source: 'rss' as const,
                isSelected: false,
                createdAt: new Date(),
                description: null,
                publishedAt: null,
            };

            mockInsertChain.then.mockImplementation((resolve) => resolve([mockHeadline]));

            const result = await service.createHeadline({
                runId: 1,
                sourceId: 1,
                title: 'Test headline',
                url: 'https://example.com',
                source: 'rss',
                isSelected: false,
            });

            expect(result).toEqual(mockHeadline);
            expect(db.insert).toHaveBeenCalled();
        });
    });

    describe('createHeadlines', () => {
        it('should return empty array for empty input', async () => {
            const result = await service.createHeadlines([]);
            expect(result).toEqual([]);
            expect(db.insert).not.toHaveBeenCalled();
        });

        it('should bulk insert multiple headlines', async () => {
            const mockHeadlines = [
                { id: 1, title: 'Headline 1' },
                { id: 2, title: 'Headline 2' },
            ];

            mockInsertChain.then.mockImplementation((resolve) => resolve(mockHeadlines));

            const result = await service.createHeadlines([
                { runId: 1, sourceId: 1, title: 'Headline 1', url: 'https://a.com', source: 'rss', isSelected: false },
                { runId: 1, sourceId: 1, title: 'Headline 2', url: 'https://b.com', source: 'rss', isSelected: false },
            ]);

            expect(result).toHaveLength(2);
        });
    });

    describe('getHeadlineById', () => {
        it('should return headline when found', async () => {
            const mockHeadline = { id: 1, title: 'Found' };
            mockSelectChain.then.mockImplementation((resolve) => resolve([mockHeadline]));

            const result = await service.getHeadlineById(1);
            expect(result).toEqual(mockHeadline);
        });

        it('should return undefined when not found', async () => {
            mockSelectChain.then.mockImplementation((resolve) => resolve([]));

            const result = await service.getHeadlineById(999);
            expect(result).toBeUndefined();
        });
    });

    describe('toggleHeadlineSelection', () => {
        it('should update headline selection', async () => {
            const mockUpdated = { id: 1, isSelected: true };
            mockUpdateChain.then.mockImplementation((resolve) => resolve([mockUpdated]));

            const result = await service.toggleHeadlineSelection(1, true);
            expect(result).toEqual(mockUpdated);
            expect(db.update).toHaveBeenCalled();
        });
    });

    describe('searchHeadlines', () => {
        it('should call db.select with correct pattern', async () => {
            const mockResults = [{ id: 1, title: 'AI News' }];
            mockSelectChain.then.mockImplementation((resolve) => resolve(mockResults));

            const result = await service.searchHeadlines(1, 'AI');
            expect(result).toEqual(mockResults);
            expect(db.select).toHaveBeenCalled();
        });
    });
});
