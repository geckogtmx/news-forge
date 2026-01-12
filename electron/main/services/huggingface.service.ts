import { net } from 'electron';

export interface HFPaper {
    title: string;
    paper: {
        id: string;
        title: string;
        summary: string;
        authors: { name: string }[];
        publishedAt: string;
        url: string;
    };
    publishedAt: string;
}

export class HuggingFaceService {
    private readonly API_BASE = 'https://huggingface.co/api/daily_papers';

    /**
     * Fetch daily papers from Hugging Face
     */
    async fetchDailyPapers(date?: string): Promise<any[]> {
        const url = date ? `${this.API_BASE}?date=${date}` : this.API_BASE;

        console.log(`[HuggingFace] Fetching daily papers from ${url}`);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch Hugging Face papers: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return this.formatPapers(data);
        } catch (error) {
            console.error('[HuggingFace] Error fetching papers:', error);
            throw error;
        }
    }

    /**
     * Format papers for standardized consumption
     */
    formatPapers(papers: any[]) {
        return papers.map((item: any) => ({
            id: item.paper.id,
            title: item.paper.title || item.title,
            summary: item.paper.summary,
            authors: item.paper.authors.map((a: any) => a.name).join(', '),
            url: `https://huggingface.co/papers/${item.paper.id}`,
            publishedAt: item.publishedAt,
            source: 'huggingface'
        }));
    }
}

export const huggingFaceService = new HuggingFaceService();
