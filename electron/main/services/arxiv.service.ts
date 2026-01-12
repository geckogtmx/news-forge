import { XMLParser } from 'fast-xml-parser';

export interface ArxivPaper {
    id: string;
    title: string;
    summary: string;
    authors: string[];
    published: string;
    updated: string;
    link: string;
    pdfLink?: string;
    category: string;
    source: 'arxiv';
}

const BASE_URL = 'http://export.arxiv.org/api/query';

export class ArxivService {
    private parser: XMLParser;

    constructor() {
        this.parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '@_',
        });
    }

    /**
     * Fetch recent papers by category
     * @param category - e.g., 'cs.AI', 'cs.LG'
     * @param maxResults - number of results to return
     */
    async fetchRecentPapers(category: string, maxResults: number = 20): Promise<ArxivPaper[]> {
        const query = `cat:${category}`;
        // sortBy=submittedDate&sortOrder=descending
        const url = `${BASE_URL}?search_query=${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;

        return this.fetchAndParse(url);
    }

    /**
     * Search papers by query string
     * @param searchQuery - e.g., 'all:electron AND all:proton'
     */
    async searchPapers(searchQuery: string, maxResults: number = 20): Promise<ArxivPaper[]> {
        const url = `${BASE_URL}?search_query=${encodeURIComponent(searchQuery)}&start=0&max_results=${maxResults}&sortBy=relevance&sortOrder=descending`;
        return this.fetchAndParse(url);
    }

    private async fetchAndParse(url: string): Promise<ArxivPaper[]> {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`ArXiv API error: ${response.statusText}`);
            }

            const xmlText = await response.text();
            const result = this.parser.parse(xmlText);
            const entries = result.feed.entry;

            if (!entries) return [];

            // entries can be a single object if only one result, or an array
            const entriesArray = Array.isArray(entries) ? entries : [entries];

            return entriesArray.map((entry: any) => {
                const id = entry.id;
                // Clean title (remove newlines usually present in arxiv results)
                const title = entry.title.replace(/\n\s+/g, ' ').trim();
                const summary = entry.summary.replace(/\n\s+/g, ' ').trim();

                let authors: string[] = [];
                if (Array.isArray(entry.author)) {
                    authors = entry.author.map((a: any) => a.name);
                } else if (entry.author) {
                    authors = [entry.author.name];
                }

                const published = entry.published;
                const updated = entry.updated;
                const category = entry.category?.['@_term'] || 'unknown';

                // Links
                let link = '';
                let pdfLink = '';

                if (Array.isArray(entry.link)) {
                    entry.link.forEach((l: any) => {
                        if (l['@_rel'] === 'alternate' && l['@_type'] === 'text/html') {
                            link = l['@_href'];
                        }
                        if (l['@_title'] === 'pdf') {
                            pdfLink = l['@_href'];
                        }
                    });
                    // Fallback if no specific rel/type matched commonly used
                    if (!link) link = id;
                } else if (entry.link) {
                    link = entry.link['@_href'];
                }

                return {
                    id,
                    title,
                    summary,
                    authors,
                    published,
                    updated,
                    link,
                    pdfLink,
                    category,
                    source: 'arxiv'
                };
            });

        } catch (error) {
            console.error('Error fetching from ArXiv:', error);
            throw error;
        }
    }
}

export const arxivService = new ArxivService();
