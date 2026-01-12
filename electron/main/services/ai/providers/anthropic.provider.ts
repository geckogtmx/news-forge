import { AIProvider, AIModel, AIRequestOptions, AIResponse } from './base.provider';

export class AnthropicProvider implements AIProvider {
    id = 'anthropic';
    name = 'Anthropic';
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

        return [
            {
                id: 'claude-3-5-sonnet-20240620', // Should update to latest if needed
                name: 'Claude 3.5 Sonnet',
                providerId: this.id,
                isLocal: false,
                contextWindow: 200000,
                costPer1kInput: 0.003,
                costPer1kOutput: 0.015
            }
        ];
    }

    async generate(options: AIRequestOptions): Promise<AIResponse> {
        const apiKey = options.apiKey || this.apiKey;
        if (!apiKey) throw new Error('Anthropic API key not configured');

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: options.modelId,
                    system: options.systemPrompt,
                    messages: [{ role: 'user', content: options.prompt }],
                    max_tokens: options.maxTokens || 4096,
                    temperature: options.temperature,
                    stop_sequences: options.stop
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Anthropic API error: ${response.status} - ${error}`);
            }

            const data = await response.json() as any;

            return {
                content: data.content[0].text,
                model: options.modelId,
                usage: {
                    // Anthropic provides usage now
                    promptTokens: data.usage?.input_tokens || 0,
                    completionTokens: data.usage?.output_tokens || 0,
                    totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
                }
            };
        } catch (error) {
            console.error('Anthropic generate error:', error);
            throw error;
        }
    }
}
