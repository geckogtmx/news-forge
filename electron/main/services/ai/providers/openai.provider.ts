import { AIProvider, AIModel, AIRequestOptions, AIResponse } from './base.provider';

export class OpenAIProvider implements AIProvider {
    id = 'openai';
    name = 'OpenAI';
    type: 'cloud' | 'local' = 'cloud';
    private apiKey: string = '';

    async initialize(config?: { apiKey?: string }) {
        if (config?.apiKey) {
            this.apiKey = config.apiKey;
        }
    }

    async isAvailable(): Promise<boolean> {
        return !!this.apiKey;
    }

    async getModels(): Promise<AIModel[]> {
        if (!this.apiKey) return [];

        // Static list for now to avoid extra API calls, or could fetch from API
        return [
            {
                id: 'gpt-4o',
                name: 'GPT-4o',
                providerId: this.id,
                isLocal: false,
                contextWindow: 128000,
                costPer1kInput: 0.005, // Example
                costPer1kOutput: 0.015
            },
            {
                id: 'gpt-4o-mini',
                name: 'GPT-4o Mini',
                providerId: this.id,
                isLocal: false,
                contextWindow: 128000,
                costPer1kInput: 0.00015,
                costPer1kOutput: 0.0006
            }
        ];
    }

    async generate(options: AIRequestOptions): Promise<AIResponse> {
        const apiKey = options.apiKey || this.apiKey;
        if (!apiKey) throw new Error('OpenAI API key not configured');

        try {
            const messages = [];
            if (options.systemPrompt) {
                messages.push({ role: 'system', content: options.systemPrompt });
            }
            messages.push({ role: 'user', content: options.prompt });

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: options.modelId,
                    messages: messages,
                    temperature: options.temperature,
                    max_tokens: options.maxTokens,
                    stop: options.stop,
                    response_format: options.json ? { type: 'json_object' } : undefined
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as any;

            return {
                content: data.choices[0].message.content,
                model: options.modelId,
                usage: {
                    promptTokens: data.usage.prompt_tokens,
                    completionTokens: data.usage.completion_tokens,
                    totalTokens: data.usage.total_tokens
                }
            };
        } catch (error) {
            console.error('OpenAI generate error:', error);
            throw error;
        }
    }
}
