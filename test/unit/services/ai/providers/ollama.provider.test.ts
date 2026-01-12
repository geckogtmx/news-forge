import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OllamaProvider } from '../../../../../electron/main/services/ai/providers/ollama.provider';

// Mock global fetch
global.fetch = vi.fn();

describe('OllamaProvider', () => {
    let provider: OllamaProvider;

    beforeEach(() => {
        provider = new OllamaProvider();
        vi.resetAllMocks();
    });

    it('should be available if fetch succeeds', async () => {
        (global.fetch as any).mockResolvedValue({ ok: true });
        const available = await provider.isAvailable();
        expect(available).toBe(true);
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/api/tags');
    });

    it('should return models correctly mapped', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ models: [{ name: 'qwen' }, { name: 'mistral' }] })
        });
        const models = await provider.getModels();
        expect(models).toHaveLength(2);
        expect(models[0].id).toBe('qwen');
        expect(models[0].providerId).toBe('ollama');
    });

    it('should generate completion', async () => {
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => ({ response: 'generated text', prompt_eval_count: 10, eval_count: 20 })
        });

        const result = await provider.generate({
            prompt: 'Hi',
            modelId: 'qwen'
        });

        expect(result.content).toBe('generated text');
        expect(result.usage?.totalTokens).toBe(30);
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:11434/api/generate',
            expect.objectContaining({ method: 'POST' })
        );
    });
});
