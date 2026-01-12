import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from '../../../electron/main/services/settings.service';
import { db } from '../../../electron/main/db';

// Mock electron safeStorage
vi.mock('electron', () => ({
    safeStorage: {
        isEncryptionAvailable: vi.fn().mockReturnValue(true),
        encryptString: vi.fn((str) => Buffer.from(`encrypted_${str}`)),
        decryptString: vi.fn((buf) => buf.toString().replace('encrypted_', ''))
    }
}));

vi.mock('../../../electron/main/db', () => {
    const mockBuilder = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        then: vi.fn((resolve) => resolve([])),
    };

    return {
        db: {
            select: vi.fn(() => mockBuilder),
            insert: vi.fn(() => mockBuilder),
            update: vi.fn(() => mockBuilder),
            delete: vi.fn(() => mockBuilder),
        }
    };
});

describe('SettingsService Security', () => {
    let service: SettingsService;

    beforeEach(() => {
        service = new SettingsService();
        vi.clearAllMocks();
    });

    it('should mask API keys in getSettings (Public)', async () => {
        // Mock DB return with encrypted key
        const mockSettings = {
            userId: 1,
            aiProviders: {
                openai: { apiKey: 'encrypted_secret-key', enabled: true }
            }
        };
        // Mock the resolved value of the chain
        const builder = (db.select() as any);
        builder.then.mockImplementation((resolve: any) => resolve([mockSettings]));

        const settings = await service.getSettings(1);
        expect((settings.aiProviders as any)['openai'].apiKey).toBe('********');
    });

    it('should decrypt API keys in getSecureSettings (Internal)', async () => {
        // 'encrypted_secret-key' in Base64
        const encryptedKey = Buffer.from('encrypted_secret-key').toString('base64');
        const mockSettings = {
            userId: 1,
            aiProviders: {
                openai: { apiKey: encryptedKey, enabled: true }
            }
        };
        const builder = (db.select() as any);
        builder.then.mockImplementation((resolve: any) => resolve([mockSettings]));

        const settings = await service.getSecureSettings(1);
        expect((settings.aiProviders as any)['openai'].apiKey).toBe('secret-key');
    });
});
