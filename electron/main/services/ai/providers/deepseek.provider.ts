import { AIProvider, AIModel, AIRequestOptions, AIResponse } from './base.provider';

export class DeepSeekProvider implements AIProvider {
    id = 'deepseek';
    name = 'DeepSeek';
    type: 'cloud' | 'local' = 'cloud';
    private apiKey: string = '';
    private baseUrl = 'https://api.deepseek.com';

    async initialize(config?: { apiKey?: string; baseUrl?: string }) {
        if (config?.apiKey) {
            this.apiKey = config.apiKey;
        }
        if (config?.baseUrl) {
            this.baseUrl = config.baseUrl;
        }
    }

    async isAvailable(): Promise<boolean> {
        return !!this.apiKey;
    }

    async getModels(): Promise<AIModel[]> {
        if (!this.apiKey) return [];

        return [
            {
                id: 'deepseek-chat',
                name: 'DeepSeek Chat (V3)',
                providerId: this.id,
                isLocal: false,
                contextWindow: 64000,
                costPer1kInput: 0.00007, // Very cheap!
                costPer1kOutput: 0.00014
            },
            {
                id: 'deepseek-reasoner',
                name: 'DeepSeek Reasoner (R1)',
                providerId: this.id,
                isLocal: false,
                contextWindow: 64000,
                costPer1kInput: 0.00014,
                costPer1kOutput: 0.00028
            }
        ];
    }

    async generate(options: AIRequestOptions): Promise<AIResponse> {
        const apiKey = options.apiKey || this.apiKey;
        if (!apiKey) throw new Error('DeepSeek API key not configured');

        try {
            const messages = [];
            if (options.systemPrompt) {
                messages.push({ role: 'system', content: options.systemPrompt });
            }
            messages.push({ role: 'user', content: options.prompt });

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
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
                throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
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
            console.error('DeepSeek generate error:', error);
            throw error;
        }
    }
}
