import { aiRegistry } from './ai/ai.registry';
import { headlineService } from './headline.service';
import { compiledItemService } from './compiled.service';
import { settingsService } from './settings.service';
import type { RawHeadline, CompiledItem } from '../db/schema';

/**
 * HeadlineGroup - Represents a cluster of related headlines
 */
export interface HeadlineGroup {
    headlines: RawHeadline[];
    topic: string;
    similarity: number;
}

/**
 * CompilationOptions - Configuration for compilation generation
 */
export interface CompilationOptions {
    modelId?: string;
    providerId?: string;
    userId: number;
    maxGroups?: number;
    similarityThreshold?: number;
}

/**
 * CompilationResult - Result of compilation generation
 */
export interface CompilationResult {
    compiledItem: CompiledItem;
    tokensUsed: number;
    cost: number;
    modelUsed: string;
}

/**
 * CompilationService - Handles headline grouping and AI-powered compilation
 */
export class CompilationService {
    /**
     * Group headlines by semantic similarity
     * For MVP, we'll use a simple keyword-based grouping approach
     * Future: Implement embedding-based semantic similarity
     */
    async groupHeadlines(
        headlines: RawHeadline[],
        options?: { similarityThreshold?: number; maxGroups?: number }
    ): Promise<HeadlineGroup[]> {
        if (headlines.length === 0) return [];

        const threshold = options?.similarityThreshold || 0.3;
        const maxGroups = options?.maxGroups || 10;

        // Simple keyword extraction and grouping
        const groups: Map<string, RawHeadline[]> = new Map();

        for (const headline of headlines) {
            const keywords = this.extractKeywords(headline.title + ' ' + (headline.description || ''));
            let assigned = false;

            // Try to find an existing group with similar keywords
            for (const [topic, groupHeadlines] of groups.entries()) {
                const topicKeywords = this.extractKeywords(topic);
                const similarity = this.calculateKeywordSimilarity(keywords, topicKeywords);

                if (similarity >= threshold) {
                    groupHeadlines.push(headline);
                    assigned = true;
                    break;
                }
            }

            // Create new group if no match found
            if (!assigned && groups.size < maxGroups) {
                const topic = this.generateTopicFromKeywords(keywords);
                groups.set(topic, [headline]);
            } else if (!assigned && groups.size >= maxGroups) {
                // Add to the largest group if max groups reached
                const largestGroup = Array.from(groups.entries()).sort((a, b) => b[1].length - a[1].length)[0];
                if (largestGroup) {
                    largestGroup[1].push(headline);
                }
            }
        }

        // Convert to HeadlineGroup array
        const result: HeadlineGroup[] = [];
        for (const [topic, groupHeadlines] of groups.entries()) {
            result.push({
                topic,
                headlines: groupHeadlines,
                similarity: 1.0, // Placeholder for now
            });
        }

        // Sort by group size (largest first)
        return result.sort((a, b) => b.headlines.length - a.headlines.length);
    }

    /**
     * Generate a compilation from a group of headlines using AI
     */
    async generateCompilation(
        headlineGroup: HeadlineGroup,
        runId: number,
        options: CompilationOptions
    ): Promise<CompilationResult> {
        // Get user settings for default model if not specified
        // Use secure settings to get API keys
        const settings = await settingsService.getSecureSettings(options.userId);
        const aiPreferences = settings?.aiPreferences as any;
        const aiProviders = settings?.aiProviders as any;

        const modelId = options.modelId || aiPreferences?.defaultModel || 'qwen2.5:7b';
        const providerId = options.providerId || 'ollama';

        // Get API key if available
        let apiKey = undefined;
        if (aiProviders && aiProviders[providerId]) {
            apiKey = aiProviders[providerId].apiKey;
        }

        // Build prompt for AI
        const prompt = this.buildCompilationPrompt(headlineGroup);

        // Call AI to generate compilation
        const response = await aiRegistry.generate(
            {
                modelId,
                prompt,
                systemPrompt: this.getSystemPrompt(),
                temperature: 0.7,
                maxTokens: 1000,
                apiKey,
            },
            providerId
        );

        // Parse AI response
        const parsed = this.parseCompilationResponse(response.content);

        // Create compiled item in database
        const compiledItem = await compiledItemService.createCompiledItem({
            runId,
            topic: parsed.topic || headlineGroup.topic,
            summary: parsed.summary,
            hook: parsed.hook,
            sourceHeadlineIds: headlineGroup.headlines.map((h) => h.id),
            isSelected: false,
        });

        return {
            compiledItem,
            tokensUsed: response.usage?.totalTokens || 0,
            cost: this.estimateCost(modelId, response.usage?.totalTokens || 0),
            modelUsed: modelId,
        };
    }

    /**
     * Compile all selected headlines for a run
     */
    async compileRun(runId: number, options: CompilationOptions): Promise<CompilationResult[]> {
        // Get selected headlines
        const headlines = await headlineService.getSelectedHeadlines(runId);

        if (headlines.length === 0) {
            throw new Error('No headlines selected for compilation');
        }

        // Group headlines
        const groups = await this.groupHeadlines(headlines, {
            similarityThreshold: options.similarityThreshold,
            maxGroups: options.maxGroups,
        });

        // Generate compilations for each group
        const results: CompilationResult[] = [];
        for (const group of groups) {
            const result = await this.generateCompilation(group, runId, options);
            results.push(result);
        }

        return results;
    }

    /**
     * Extract keywords from text (simple implementation)
     */
    private extractKeywords(text: string): string[] {
        // Remove common stop words and extract meaningful keywords
        const stopWords = new Set([
            'the',
            'a',
            'an',
            'and',
            'or',
            'but',
            'in',
            'on',
            'at',
            'to',
            'for',
            'of',
            'with',
            'by',
            'from',
            'as',
            'is',
            'was',
            'are',
            'were',
            'been',
            'be',
            'have',
            'has',
            'had',
            'do',
            'does',
            'did',
            'will',
            'would',
            'should',
            'could',
            'may',
            'might',
            'can',
            'this',
            'that',
            'these',
            'those',
        ]);

        const words = text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter((word) => word.length > 3 && !stopWords.has(word));

        // Count word frequency
        const frequency = new Map<string, number>();
        for (const word of words) {
            frequency.set(word, (frequency.get(word) || 0) + 1);
        }

        // Return top keywords by frequency
        return Array.from(frequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map((entry) => entry[0]);
    }

    /**
     * Calculate similarity between two keyword sets (Jaccard similarity)
     */
    private calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
        const set1 = new Set(keywords1);
        const set2 = new Set(keywords2);

        const intersection = new Set([...set1].filter((x) => set2.has(x)));
        const union = new Set([...set1, ...set2]);

        return union.size === 0 ? 0 : intersection.size / union.size;
    }

    /**
     * Generate a topic name from keywords
     */
    private generateTopicFromKeywords(keywords: string[]): string {
        if (keywords.length === 0) return 'General News';
        return keywords
            .slice(0, 3)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' & ');
    }

    /**
     * Build prompt for compilation generation
     */
    private buildCompilationPrompt(group: HeadlineGroup): string {
        const headlinesList = group.headlines
            .map((h, i) => `${i + 1}. ${h.title}\n   ${h.description || 'No description'}`)
            .join('\n\n');

        return `You are analyzing a group of related news headlines about "${group.topic}".

Headlines:
${headlinesList}

Please create a comprehensive compilation that:
1. Identifies the main topic/theme
2. Writes a compelling hook (1-2 sentences to grab attention)
3. Provides a detailed summary (2-3 paragraphs) that synthesizes the key information from all headlines

Format your response as JSON:
{
  "topic": "Main topic or theme",
  "hook": "Compelling hook sentence",
  "summary": "Detailed summary synthesizing all headlines"
}`;
    }

    /**
     * Get system prompt for compilation
     */
    private getSystemPrompt(): string {
        return `You are an expert news analyst and content compiler. Your job is to analyze multiple related news headlines and create comprehensive, engaging compilations that synthesize the key information. Focus on accuracy, clarity, and creating content that would be valuable for YouTube creators and researchers.`;
    }

    /**
     * Parse AI response into structured format
     */
    private parseCompilationResponse(content: string): {
        topic: string;
        hook: string;
        summary: string;
    } {
        try {
            // Clean content: remove markdown code blocks
            let cleanContent = content.trim();
            if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent.replace(/^```(json)?\n?/, '').replace(/\n?```$/, '');
            }

            // Try to find JSON object if it's buried in text
            const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanContent = jsonMatch[0];
            }

            // Try to parse as JSON
            const parsed = JSON.parse(cleanContent);
            return {
                topic: parsed.topic || 'Untitled',
                hook: parsed.hook || '',
                summary: parsed.summary || content,
            };
        } catch (error) {
            console.warn('[CompilationService] Failed to parse JSON:', content);
            // Fallback: extract from text
            return {
                topic: 'Untitled',
                hook: '',
                summary: content,
            };
        }
    }

    /**
     * Estimate cost based on model and tokens
     * TODO: Move to cost-estimator.service.ts when implemented
     */
    private estimateCost(modelId: string, tokens: number): number {
        // Pricing per 1M tokens (approximate)
        const pricing: Record<string, { input: number; output: number }> = {
            'claude-3.5-sonnet': { input: 3.0, output: 15.0 },
            'gpt-4o': { input: 2.5, output: 10.0 },
            'gpt-4o-mini': { input: 0.15, output: 0.6 },
            'deepseek-chat': { input: 0.14, output: 0.28 },
        };

        // Local models are free
        if (modelId.includes('qwen') || modelId.includes('mistral') || modelId.includes('emma')) {
            return 0;
        }

        // Estimate 50/50 split between input and output tokens
        const modelPricing = pricing[modelId] || { input: 1.0, output: 2.0 };
        const inputTokens = tokens * 0.5;
        const outputTokens = tokens * 0.5;

        return (inputTokens * modelPricing.input + outputTokens * modelPricing.output) / 1_000_000;
    }

    /**
     * Score compilation quality (placeholder for future implementation)
     */
    async scoreCompilationQuality(compilation: CompiledItem): Promise<number> {
        // TODO: Implement quality scoring
        // Could check for:
        // - Summary length and completeness
        // - Presence of key information
        // - Coherence and readability
        // - Factual consistency with source headlines
        return 0.8; // Placeholder score
    }
}

// Export singleton instance
export const compilationService = new CompilationService();
