import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * GeminiService - Handles AI-powered content analysis using Google's Gemini API
 * 
 * Primary use case: Analyzing YouTube videos to extract topics and summaries
 */

export interface GeminiYoutubeAnalysis {
    topics: string[];
    summary: string;
    keyPoints: string[];
}

class GeminiService {
    private client: GoogleGenerativeAI | null = null;
    private model: string = 'gemini-2.5-flash'; // Fast model for high-volume tasks

    /**
     * Initialize Gemini client with API key
     */
    initialize(apiKey: string): void {
        if (!apiKey) {
            throw new Error('Gemini API key is required');
        }
        this.client = new GoogleGenerativeAI(apiKey);
        console.log('[Gemini] Service initialized with model:', this.model);
    }

    /**
     * Ensure client is initialized
     */
    private ensureInitialized(): void {
        if (!this.client) {
            throw new Error('Gemini service not initialized. Call initialize() first.');
        }
    }

    /**
     * Analyze YouTube video metadata using Gemini
     * Note: Gemini API cannot directly watch YouTube videos
     * Instead, we analyze the title and description to extract topics
     */
    async analyzeYoutubeMetadata(title: string, description: string): Promise<GeminiYoutubeAnalysis> {
        this.ensureInitialized();

        try {
            console.log('[Gemini] Analyzing YouTube metadata');

            const model = this.client!.getGenerativeModel({ model: this.model });

            // Craft a prompt to analyze the video metadata
            const prompt = `Analyze this YouTube video based on its title and description.

Video Title: ${title}

Video Description: ${description}

Please provide:
1. **Topics**: 3-5 key topics or themes (comma-separated)
2. **Summary**: A concise 2-3 sentence summary
3. **Key Points**: 3-5 important points

Format as JSON:
{
  "topics": ["topic1", "topic2", "topic3"],
  "summary": "Your summary here",
  "keyPoints": ["point1", "point2", "point3"]
}`;

            const result = await model.generateContent(prompt);
            const response = result.response;
            const text = response.text();

            console.log('[Gemini] Raw response:', text.substring(0, 200) + '...');

            // Parse the JSON response
            const analysis = this.parseGeminiResponse(text);

            console.log('[Gemini] Analysis complete:', {
                topics: analysis.topics.length,
                summaryLength: analysis.summary.length,
                keyPoints: analysis.keyPoints.length
            });

            return analysis;
        } catch (error: any) {
            console.error('[Gemini] Error analyzing metadata:', error);
            throw new Error(`Failed to analyze with Gemini: ${error.message}`);
        }
    }

    /**
     * Parse Gemini's response into structured data
     */
    private parseGeminiResponse(text: string): GeminiYoutubeAnalysis {
        try {
            // Try to extract JSON from the response
            // Gemini sometimes wraps JSON in markdown code blocks
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);

            // Validate and normalize the response
            return {
                topics: Array.isArray(parsed.topics) ? parsed.topics : [],
                summary: typeof parsed.summary === 'string' ? parsed.summary : '',
                keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : []
            };
        } catch (error) {
            console.error('[Gemini] Failed to parse response, using fallback');

            // Fallback: Try to extract information from unstructured text
            return this.extractFromUnstructuredText(text);
        }
    }

    /**
     * Fallback parser for when JSON parsing fails
     */
    private extractFromUnstructuredText(text: string): GeminiYoutubeAnalysis {
        // Extract topics (look for lists or comma-separated items)
        const topicsMatch = text.match(/topics?:?\s*([^\n]+)/i);
        const topics = topicsMatch
            ? topicsMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0)
            : [];

        // Extract summary (first few sentences)
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
        const summary = sentences.slice(0, 3).join(' ').trim();

        // Extract key points (look for bullet points or numbered lists)
        const keyPointsMatches = text.match(/[-•*]\s*([^\n]+)/g) || [];
        const keyPoints = keyPointsMatches
            .map(point => point.replace(/^[-•*]\s*/, '').trim())
            .slice(0, 5);

        return {
            topics: topics.slice(0, 5),
            summary: summary || text.substring(0, 300),
            keyPoints
        };
    }

    /**
     * Test the Gemini connection
     */
    async testConnection(): Promise<boolean> {
        this.ensureInitialized();

        try {
            const model = this.client!.getGenerativeModel({ model: this.model });
            const result = await model.generateContent('Say "OK" if you can read this.');
            const text = result.response.text();
            console.log('[Gemini] Connection test:', text);
            return true;
        } catch (error) {
            console.error('[Gemini] Connection test failed:', error);
            return false;
        }
    }
}

// Export singleton instance
export const geminiService = new GeminiService();
