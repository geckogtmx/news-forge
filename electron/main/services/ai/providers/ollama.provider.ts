import { AIProvider, AIModel, AIRequestOptions, AIResponse } from './base.provider';

export class OllamaProvider implements AIProvider {
    id = 'ollama';
    name = 'Ollama (Local)';
    type: 'local' | 'cloud' = 'local';
    private baseUrl = 'http://localhost:11434';

    async initialize(config?: { baseUrl?: string }) {
        if (config?.baseUrl) {
            this.baseUrl = config.baseUrl;
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    async getModels(): Promise<AIModel[]> {
        try {
            const response = await fetch(`${this.baseUrl}/api/tags`);
            if (!response.ok) throw new Error('Failed to fetch Ollama models');

            const data = await response.json() as { models: any[] };
            return data.models.map((m: any) => ({
                id: m.name,
                name: m.name,
                providerId: this.id,
                isLocal: true,
                // Approximate context window or unknown
                contextWindow: m.details?.context_window || 4096
            }));
        } catch (error) {
            console.error('Ollama getModels error:', error);
            return [];
        }
    }

    async generate(options: AIRequestOptions): Promise<AIResponse> {
        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: options.modelId,
                    prompt: options.prompt,
                    system: options.systemPrompt,
                    stream: false, // For now, no streaming
                    options: {
                        temperature: options.temperature,
                        num_predict: options.maxTokens,
                        stop: options.stop
                    },
                    format: options.json ? 'json' : undefined
                })
            });

            if (!response.ok) {
                throw new Error(`Ollama API error: ${response.statusText}`);
            }

            const data = await response.json() as any;

            return {
                content: data.response,
                model: options.modelId,
                usage: {
                    promptTokens: data.prompt_eval_count || 0,
                    completionTokens: data.eval_count || 0,
                    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
                }
            };
        } catch (error) {
            console.error('Ollama generate error:', error);
            throw error;
        }
    }
}
