
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, AIModel, AIRequestOptions, AIResponse } from './base.provider';

export class GoogleProvider implements AIProvider {
    id = 'google';
    name = 'Google Gemini';
    type: 'cloud' = 'cloud';

    private client: GoogleGenerativeAI | null = null;
    private apiKey: string = '';

    async initialize(config?: any): Promise<void> {
        if (config?.apiKey) {
            this.apiKey = config.apiKey;
            this.client = new GoogleGenerativeAI(this.apiKey);
        } else if (process.env.GEMINI_API_KEY) {
            // Fallback to env var
            this.apiKey = process.env.GEMINI_API_KEY;
            this.client = new GoogleGenerativeAI(this.apiKey);
        }
    }

    async getModels(apiKey?: string): Promise<AIModel[]> {
        const staticModels: AIModel[] = [
            { id: 'gemini-pro', name: 'Gemini 1.0 Pro', providerId: 'google', contextWindow: 32000, costPer1kInput: 0.0005, costPer1kOutput: 0.0015 },
        ].map(m => ({ ...m, enabled: true, isLocal: false }));

        const effectiveKey = apiKey || this.apiKey;

        try {
            if (effectiveKey) {
                console.log('[GoogleProvider] Fetching dynamic models...');
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${effectiveKey}`);
                if (response.ok) {
                    const data = await response.json();
                    console.log(`[GoogleProvider] Fetched ${data.models?.length || 0} models`);

                    if (data.models && Array.isArray(data.models)) {
                        const dynamicModels = data.models
                            .filter((m: any) => {
                                const name = m.name.toLowerCase();

                                // Must be a Gemini model
                                if (!name.includes('gemini')) return false;

                                // Exclusion keywords
                                const excluded = [
                                    'experimental', 'exp', 'embedding', 'robotics', 'legacy', 'vision', '001', '002', 'computer'
                                    // '001' often implies 1.0 or specific old endpoint, but 1.5-flash-001 exists. 
                                    // Let's stick to user's text: "experimental, robotic, embeding" and "< 2.5", plus "computer"
                                ];
                                if (excluded.some(ex => name.includes(ex))) return false;

                                // Version Check
                                // Extract version number X.Y
                                const versionMatch = name.match(/gemini-(\d+(\.\d+)?)/);
                                if (versionMatch) {
                                    const version = parseFloat(versionMatch[1]);
                                    if (version < 2.5) return false;
                                } else {
                                    // If no version number found (e.g. "gemini-pro"), assume it's older (1.0/1.5)
                                    // unless it explicitly says "latest" and we trust it? 
                                    // "gemini-pro" is 1.0. "gemini-1.5-pro" is 1.5.
                                    // So if no version, exclude.
                                    return false;
                                }

                                return true;
                            })
                            .map((m: any) => {
                                const id = m.name.replace('models/', '');
                                return {
                                    id: id,
                                    name: m.displayName || id,
                                    providerId: 'google',
                                    enabled: true,
                                    isLocal: false,
                                    contextWindow: m.inputTokenLimit || 1000000,
                                    costPer1kInput: 0,
                                    costPer1kOutput: 0
                                };
                            });

                        // User Request: "Stop faking the fetch". 
                        // If we successfully fetched models, RETURN ONLY THOSE.
                        // Do NOT merge with static models.
                        return dynamicModels;
                    }
                } else {
                    console.error(`[GoogleProvider] Failed to fetch models: ${response.status} ${response.statusText}`);
                    // If fetch fails, we might want to throw or return empty to indicate failure 
                    // rather than falling back to static which might be wrong.
                    // But for robustness, if network fails, static might be better?
                    // User said: "If its not actually fetching I do not want it."
                    // So we should probably return empty or throw.
                    // For now, let's return empty if we have a key but failed (so UI shows error/empty).
                    return [];
                }
            } else {
                console.log('[GoogleProvider] No API key for dynamic fetch');
            }
        } catch (error) {
            console.error('[GoogleProvider] Failed to fetch dynamic Gemini models:', error);
            // On error with key, return empty to respect "no faking".
            if (this.apiKey) return [];
        }

        // Only return static models if NO API Key is configured (setup mode).
        return staticModels;
    }

    async generate(options: AIRequestOptions): Promise<AIResponse> {
        // Use per-request key if provided, else instance key
        let currentClient = this.client;

        if (options.apiKey) {
            currentClient = new GoogleGenerativeAI(options.apiKey);
        }

        if (!currentClient) {
            // Try to re-init from env if possible
            if (process.env.GEMINI_API_KEY) {
                this.initialize({});
                currentClient = this.client;
            }

            if (!currentClient) {
                throw new Error('Google Gemini not configured (no API key)');
            }
        }

        const modelId = options.modelId || 'gemini-1.5-flash';
        const model = currentClient.getGenerativeModel({
            model: modelId,
            generationConfig: {
                temperature: options.temperature,
                maxOutputTokens: options.maxTokens,
                stopSequences: options.stop,
                responseMimeType: options.json ? 'application/json' : 'text/plain',
            }
        });

        // Gemini handles system prompts differently (systemInstruction)
        // Check if SDK supports systemInstruction in getGenerativeModel (v0.12+)
        // Assuming current version does.

        // However, if we utilize generic prompt construction:
        let fullPrompt = options.prompt;

        // Note: GoogleGenerativeAI SDK logic:
        // If system prompt is needed, it's safer to pass it in getGenerativeModel config 
        // OR simply prepend it if using older models/SDKs. 
        // For 1.5 models, systemInstruction is supported.

        // Let's create a new model instance if system prompt is present to be safe
        const modelWithSystem = currentClient.getGenerativeModel({
            model: modelId,
            systemInstruction: options.systemPrompt,
            generationConfig: {
                temperature: options.temperature,
                maxOutputTokens: options.maxTokens,
                stopSequences: options.stop,
                responseMimeType: options.json ? 'application/json' : 'text/plain',
            }
        });

        const result = await modelWithSystem.generateContent(options.prompt);
        const response = await result.response;
        const text = response.text();

        return {
            content: text,
            model: modelId,
            usage: {
                // Usage metadata might be in response.usageMetadata
                promptTokens: response.usageMetadata?.promptTokenCount || 0,
                completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: response.usageMetadata?.totalTokenCount || 0,
            }
        };
    }

    async isAvailable(): Promise<boolean> {
        return !!this.client || !!process.env.GEMINI_API_KEY;
    }
}
