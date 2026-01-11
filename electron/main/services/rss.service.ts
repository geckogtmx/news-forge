import Parser from 'rss-parser';
import type { InsertRawHeadline } from '../db/schema';

interface FeedItem {
    title?: string;
    link?: string;
    content?: string;
    contentSnippet?: string;
    pubDate?: string;
    isoDate?: string;
}

interface Feed {
    title?: string;
    description?: string;
    link?: string;
    items: FeedItem[];
}

interface DiscoveredFeed {
    url: string;
    title?: string;
    type: 'rss' | 'atom' | 'json';
}

/**
 * RSS Service - Handles RSS/Atom feed parsing and discovery
 */
export class RssService {
    private parser: Parser;
    private readonly TIMEOUT_MS = 30000; // 30 seconds
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY_MS = 1000;

    constructor() {
        this.parser = new Parser({
            timeout: this.TIMEOUT_MS,
            headers: {
                'User-Agent': 'NewsForge/1.0',
            },
        });
    }

    /**
     * Fetch and parse an RSS/Atom feed
     */
    async fetchFeed(url: string): Promise<Feed> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
            try {
                const feed = await this.parser.parseURL(url);
                return feed as Feed;
            } catch (error: any) {
                lastError = error;
                console.warn(`[RSS] Attempt ${attempt}/${this.MAX_RETRIES} failed for ${url}:`, error.message);

                if (attempt < this.MAX_RETRIES) {
                    await this.delay(this.RETRY_DELAY_MS * attempt);
                }
            }
        }

        throw new Error(`Failed to fetch feed after ${this.MAX_RETRIES} attempts: ${lastError?.message}`);
    }

    /**
     * Extract headlines from a parsed feed
     */
    extractHeadlines(
        feed: Feed,
        runId: number,
        sourceId: number
    ): Omit<InsertRawHeadline, 'id' | 'createdAt'>[] {
        return feed.items.map((item) => ({
            runId,
            sourceId,
            title: item.title || 'Untitled',
            description: item.contentSnippet || item.content || null,
            url: item.link || '',
            publishedAt: this.parseDate(item.isoDate || item.pubDate),
            source: 'rss' as const,
            isSelected: false,
        }));
    }

    /**
     * Discover RSS feeds from a website URL
     */
    async discoverFeeds(websiteUrl: string): Promise<DiscoveredFeed[]> {
        const discovered: DiscoveredFeed[] = [];

        try {
            // Fetch the HTML page
            const response = await fetch(websiteUrl, {
                headers: {
                    'User-Agent': 'NewsForge/1.0',
                },
                signal: AbortSignal.timeout(this.TIMEOUT_MS),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const html = await response.text();

            // Parse HTML for <link rel="alternate"> tags
            const linkRegex = /<link[^>]*rel=["']alternate["'][^>]*>/gi;
            const matches = html.match(linkRegex) || [];

            for (const match of matches) {
                const typeMatch = match.match(/type=["']([^"']+)["']/i);
                const hrefMatch = match.match(/href=["']([^"']+)["']/i);
                const titleMatch = match.match(/title=["']([^"']+)["']/i);

                if (hrefMatch && typeMatch) {
                    const type = typeMatch[1].toLowerCase();
                    if (type.includes('rss') || type.includes('atom') || type.includes('xml')) {
                        const feedUrl = this.resolveUrl(websiteUrl, hrefMatch[1]);
                        discovered.push({
                            url: feedUrl,
                            title: titleMatch ? titleMatch[1] : undefined,
                            type: type.includes('atom') ? 'atom' : 'rss',
                        });
                    }
                }
            }

            // Check common feed paths if no feeds found
            if (discovered.length === 0) {
                const commonPaths = ['/feed', '/rss', '/atom.xml', '/feed.xml', '/rss.xml'];
                const baseUrl = new URL(websiteUrl);

                for (const path of commonPaths) {
                    const feedUrl = `${baseUrl.origin}${path}`;
                    try {
                        await this.fetchFeed(feedUrl);
                        discovered.push({
                            url: feedUrl,
                            type: path.includes('atom') ? 'atom' : 'rss',
                        });
                    } catch {
                        // Feed doesn't exist, continue
                    }
                }
            }

            return discovered;
        } catch (error: any) {
            console.error('[RSS] Feed discovery failed:', error.message);
            throw new Error(`Feed discovery failed: ${error.message}`);
        }
    }

    /**
     * Validate a feed URL by attempting to fetch it
     */
    async validateFeed(url: string): Promise<{ valid: boolean; error?: string; title?: string }> {
        try {
            const feed = await this.fetchFeed(url);
            return {
                valid: true,
                title: feed.title,
            };
        } catch (error: any) {
            return {
                valid: false,
                error: error.message,
            };
        }
    }

    /**
     * Parse date string to Date object
     */
    private parseDate(dateString?: string): Date | null {
        if (!dateString) return null;
        try {
            return new Date(dateString);
        } catch {
            return null;
        }
    }

    /**
     * Resolve relative URLs to absolute
     */
    private resolveUrl(baseUrl: string, relativeUrl: string): string {
        try {
            return new URL(relativeUrl, baseUrl).href;
        } catch {
            return relativeUrl;
        }
    }

    /**
     * Delay helper for retry logic
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// Export singleton instance
export const rssService = new RssService();
