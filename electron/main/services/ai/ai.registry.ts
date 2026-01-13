import { AIProvider, AIModel, AIRequestOptions, AIResponse } from './providers/base.provider';

export class AIRegistry {
    private providers: Map<string, AIProvider> = new Map();
    private defaultProviderId: string = 'ollama'; // Default to local

    constructor() { }

    registerProvider(provider: AIProvider) {
        this.providers.set(provider.id, provider);
        console.log(`[AIRegistry] Registered provider: ${provider.id}`);
    }

    getProvider(id: string): AIProvider | undefined {
        return this.providers.get(id);
    }

    async getAllModels(providerKeys?: Record<string, string>, providerId?: string): Promise<AIModel[]> {
        const models: AIModel[] = [];

        const providersToFetch = providerId
            ? [this.providers.get(providerId)].filter(p => p !== undefined) as AIProvider[]
            : Array.from(this.providers.values());

        for (const provider of providersToFetch) {
            try {
                // Pass specific API key for this provider if available
                const apiKey = providerKeys?.[provider.id];
                const providerModels = await provider.getModels(apiKey);
                models.push(...providerModels);
            } catch (error) {
                console.error(`[AIRegistry] Failed to fetch models from ${provider.id}:`, error);
            }
        }

        return models;
    }

    async generate(options: AIRequestOptions, providerId?: string): Promise<AIResponse> {
        // 1. Determine provider
        let provider = providerId ? this.providers.get(providerId) : undefined;

        // 2. If no specific provider requested, or not found, try to infer from modelId
        if (!provider && options.modelId) {
            // Naive check: iterate all providers to see who owns this model
            // Optimization: Maintain a model->provider map cache
            for (const p of this.providers.values()) {
                try {
                    const models = await p.getModels();
                    if (models.find(m => m.id === options.modelId)) {
                        provider = p;
                        break;
                    }
                } catch (e) {
                    // Ignore errors during lookup
                }
            }
        }

        // 3. Fallback to default
        if (!provider) {
            provider = this.providers.get(this.defaultProviderId);
        }

        if (!provider) {
            throw new Error(`No AI provider available (requested: ${providerId || 'auto'})`);
        }

        // 4. Execute
        return provider.generate(options);
    }
}

export const aiRegistry = new AIRegistry();
