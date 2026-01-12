import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIRegistry } from '../../../../electron/main/services/ai/ai.registry';
import { AIProvider, AIRequestOptions } from '../../../../electron/main/services/ai/providers/base.provider';

describe('AIRegistry', () => {
    let registry: AIRegistry;
    let mockProvider: AIProvider;

    beforeEach(() => {
        registry = new AIRegistry();
        mockProvider = {
            id: 'mock',
            name: 'Mock Provider',
            type: 'local',
            initialize: vi.fn(),
            getModels: vi.fn().mockResolvedValue([]),
            generate: vi.fn().mockResolvedValue({ content: 'result', model: 'test' }),
            isAvailable: vi.fn().mockResolvedValue(true)
        };
    });

    it('should register a provider', () => {
        registry.registerProvider(mockProvider);
        expect(registry.getProvider('mock')).toBe(mockProvider);
    });

    it('should use specific provider if requested', async () => {
        registry.registerProvider(mockProvider);
        const options: AIRequestOptions = { prompt: 'test', modelId: 'm1' };
        await registry.generate(options, 'mock');
        expect(mockProvider.generate).toHaveBeenCalledWith(options);
    });

    it('should throw if provider not found', async () => {
        await expect(registry.generate({ prompt: 'test', modelId: 'm1' }, 'unknown'))
            .rejects.toThrow();
    });
});
