import { describe, it, expect } from 'vitest';
import { safeUrl, createSourceSchema, createHeadlineSchema, validateIpcArgs } from '../../electron/shared/validation';

describe('safeUrl', () => {
    it('should accept valid public HTTPS URLs', () => {
        expect(safeUrl.safeParse('https://example.com').success).toBe(true);
        expect(safeUrl.safeParse('https://feeds.example.com/rss.xml').success).toBe(true);
        expect(safeUrl.safeParse('http://news.ycombinator.com/rss').success).toBe(true);
    });

    it('should reject localhost URLs', () => {
        expect(safeUrl.safeParse('http://localhost:3000').success).toBe(false);
        expect(safeUrl.safeParse('http://127.0.0.1:8080').success).toBe(false);
        expect(safeUrl.safeParse('http://0.0.0.0').success).toBe(false);
        expect(safeUrl.safeParse('http://foo.localhost').success).toBe(false);
    });

    it('should reject private IP ranges', () => {
        expect(safeUrl.safeParse('http://10.0.0.1').success).toBe(false);
        expect(safeUrl.safeParse('http://172.16.0.1').success).toBe(false);
        expect(safeUrl.safeParse('http://192.168.1.1').success).toBe(false);
        expect(safeUrl.safeParse('http://169.254.0.1').success).toBe(false);
    });

    it('should reject non-http schemes', () => {
        expect(safeUrl.safeParse('ftp://example.com').success).toBe(false);
        expect(safeUrl.safeParse('file:///etc/passwd').success).toBe(false);
    });

    it('should reject non-URL strings', () => {
        expect(safeUrl.safeParse('not-a-url').success).toBe(false);
        expect(safeUrl.safeParse('').success).toBe(false);
    });
});

describe('createSourceSchema', () => {
    it('should accept valid source data', () => {
        const result = createSourceSchema.safeParse({
            userId: 1,
            name: 'Tech News',
            type: 'rss',
            config: { feedUrl: 'https://example.com/feed' },
            topics: ['tech', 'ai'],
        });
        expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
        const result = createSourceSchema.safeParse({
            userId: 1,
            name: '',
            type: 'rss',
            config: {},
            topics: [],
        });
        expect(result.success).toBe(false);
    });

    it('should reject invalid source types', () => {
        const result = createSourceSchema.safeParse({
            userId: 1,
            name: 'Test',
            type: 'invalid',
            config: {},
            topics: [],
        });
        expect(result.success).toBe(false);
    });

    it('should reject negative userId', () => {
        const result = createSourceSchema.safeParse({
            userId: -1,
            name: 'Test',
            type: 'rss',
            config: {},
            topics: [],
        });
        expect(result.success).toBe(false);
    });
});

describe('createHeadlineSchema', () => {
    it('should accept valid headline data', () => {
        const result = createHeadlineSchema.safeParse({
            runId: 1,
            sourceId: 2,
            title: 'Breaking News',
            url: 'https://example.com/article',
            source: 'rss',
        });
        expect(result.success).toBe(true);
    });

    it('should accept optional fields as null', () => {
        const result = createHeadlineSchema.safeParse({
            runId: 1,
            sourceId: 2,
            title: 'Test',
            url: 'https://example.com',
            source: 'youtube',
            description: null,
            publishedAt: null,
        });
        expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
        const result = createHeadlineSchema.safeParse({
            runId: 1,
            sourceId: 2,
            title: '',
            url: 'https://example.com',
            source: 'rss',
        });
        expect(result.success).toBe(false);
    });
});

describe('validateIpcArgs', () => {
    it('should pass through channels without schemas', () => {
        const args = [1, 'hello'];
        expect(validateIpcArgs('user:get-by-id', args)).toEqual(args);
    });

    it('should validate and pass valid RSS URL', () => {
        const result = validateIpcArgs('rss:fetch-feed', ['https://example.com/feed.xml']);
        expect(result).toEqual(['https://example.com/feed.xml']);
    });

    it('should throw on invalid RSS URL (SSRF)', () => {
        expect(() =>
            validateIpcArgs('rss:fetch-feed', ['http://192.168.1.1/internal']),
        ).toThrow('Validation failed');
    });

    it('should validate headline search args', () => {
        const result = validateIpcArgs('headline:search', [1, 'AI news']);
        expect(result).toEqual([1, 'AI news']);
    });

    it('should throw on invalid headline search (empty query)', () => {
        expect(() =>
            validateIpcArgs('headline:search', [1, '']),
        ).toThrow('Validation failed');
    });

    it('should validate YouTube URLs', () => {
        const result = validateIpcArgs('youtube:fetch-video', ['https://www.youtube.com/watch?v=abc123']);
        expect(result).toEqual(['https://www.youtube.com/watch?v=abc123']);
    });

    it('should reject non-YouTube URLs for YouTube channels', () => {
        expect(() =>
            validateIpcArgs('youtube:fetch-video', ['https://vimeo.com/12345']),
        ).toThrow('Validation failed');
    });
});
