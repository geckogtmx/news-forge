export interface AIRequestOptions {
    modelId: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    stop?: string[];
    json?: boolean; // Force JSON output
    apiKey?: string; // Optional per-request API key
}

export interface AIResponseUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface AIResponse {
    content: string;
    usage?: AIResponseUsage;
    model: string;
}

export interface AIModel {
    id: string;
    name: string;
    providerId: string;
    contextWindow?: number;
    isLocal: boolean;
    costPer1kInput?: number; // In USD
    costPer1kOutput?: number; // In USD
}

export interface AIProvider {
    id: string;
    name: string;
    type: 'local' | 'cloud';

    /**
     * Initialize the provider (e.g., check connection, validate API key)
     */
    initialize(config?: any): Promise<void>;

    /**
     * Get list of available models from this provider
     */
    getModels(): Promise<AIModel[]>;

    /**
     * Generate text completion
     */
    generate(options: AIRequestOptions): Promise<AIResponse>;

    /**
     * Check if provider is ready/available
     */
    isAvailable(): Promise<boolean>;
}
