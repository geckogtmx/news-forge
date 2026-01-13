/**
 * Service Layer - Centralized export for all services
 * 
 * This file provides a single import point for all service instances.
 * Services handle all database operations and business logic.
 */

import { userService, UserService } from './user.service';
import { newsSourceService, NewsSourceService } from './source.service';
import { runService, RunService } from './run.service';
import { headlineService, HeadlineService } from './headline.service';
import { compiledItemService, CompiledItemService } from './compiled.service';
import { contentPackageService, ContentPackageService } from './package.service';
import { archiveService, ArchiveService } from './archive.service';
import { settingsService, SettingsService } from './settings.service';
import { progressService, ProgressService } from './progress.service';
import { rssService, RssService } from './rss.service';
import { gmailService } from './gmail.service';
import { youtubeService } from './youtube.service';
import { geminiService } from './gemini.service';
import { arxivService } from './arxiv.service';
import { huggingFaceService } from './huggingface.service';
import { fetchCoordinatorService, FetchCoordinatorService } from './fetch-coordinator.service';
import { aiRegistry, AIRegistry } from './ai/ai.registry';
import { OllamaProvider } from './ai/providers/ollama.provider';
import { OpenAIProvider } from './ai/providers/openai.provider';
import { AnthropicProvider } from './ai/providers/anthropic.provider';
import { DeepSeekProvider } from './ai/providers/deepseek.provider';
import { GoogleProvider } from './ai/providers/google.provider';

export {
    userService, UserService,
    newsSourceService, NewsSourceService,
    runService, RunService,
    headlineService, HeadlineService,
    compiledItemService, CompiledItemService,
    contentPackageService, ContentPackageService,
    archiveService, ArchiveService,
    settingsService, SettingsService,
    rssService, RssService,
    gmailService,
    youtubeService,
    arxivService,
    huggingFaceService,
    fetchCoordinatorService, FetchCoordinatorService,
};

// Re-export all services as a single object for convenience
export const services = {
    user: userService,
    newsSource: newsSourceService,
    run: runService,
    headline: headlineService,
    compiledItem: compiledItemService,
    contentPackage: contentPackageService,
    archive: archiveService,
    settings: settingsService,
    progress: progressService,
    rss: rssService,
    gmail: gmailService,
    youtube: youtubeService,
    gemini: geminiService,
    arxiv: arxivService,
    huggingFace: huggingFaceService,
    fetchCoordinator: fetchCoordinatorService,
    aiRegistry: aiRegistry,
};

/**
 * Initialize all services
 */
export async function initializeServices() {
    console.log('[Services] Initializing all services...');

    // Initialize Gemini service with API key from environment
    // Use process.env in Electron main process (import.meta.env doesn't work here)
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
        try {
            services.gemini.initialize(geminiApiKey);
            console.log('[Services] Gemini service initialized');
        } catch (error) {
            console.error('[Services] Failed to initialize Gemini service:', error);
        }
    } else {
        console.warn('[Services] GEMINI_API_KEY not found in environment');
    }

    console.log('[Services] All services initialized');

    // Initialize AI Registry
    console.log('[Services] Initializing AI Providers...');
    const ollama = new OllamaProvider();
    const openai = new OpenAIProvider();
    const anthropic = new AnthropicProvider();
    const deepseek = new DeepSeekProvider();
    const google = new GoogleProvider();

    aiRegistry.registerProvider(ollama);
    aiRegistry.registerProvider(openai);
    aiRegistry.registerProvider(anthropic);
    aiRegistry.registerProvider(deepseek);
    aiRegistry.registerProvider(google);

    // Hydrate from settings (async)
    // We don't await this to avoid blocking startup if DB is slow, 
    // but in a real app we might want to ensure keys are loaded.
    // For now, we'll do a quick load.
    try {
        // Just grab the first user for now (single user app assumption)
        // or iterate all users? This app seems single-user focused primarily but supports multi-user schema.
        // Let's assume userId 1 or we wait for request.
        // Actually, providers are global services here.
        // But settings are per user.
        // This implies the Provider needs to be configured PER REQUEST or hold a map of configs?
        // My provider implementation stores a single apiKey.
        // This is a disconnect. If the app is multi-user, the provider instance should probably take apiKey in `generate(options)`.

        // REFACTOR: Update AIProvider.generate to accept apiKey in options or context.
        // OR: AIProvider manages its own internal state if it was a desktop app single user.
        // Given "User 1" is usually the main user, I will stick to single-tenancy for the "System Providers".
        // But `SettingsService` is user-keyed.

        // I will modify `AIRequestOptions` effectively in the previous interface? 
        // No, `AIRequestOptions` is for generation parameters.

        // Let's modify `AIProvider.generate` signature in my thought process?
        // Actually, `generate` takes `options`. I can pass `apiKey` in `options` if needed?
        // But `base.provider.ts` defined options already.

        // Ideally: `aiRegistry.generate(options, providerId, userId)` -> look up settings for userId -> pass key to provider.

        // For this task, I'll update `AIRegistry.generate` to optionally take `userId`, fetch keys, and pass them to provider?
        // BUT, the provider interfaces I wrote `initialize(config)` and store key locally.
        // This is fine for single user local app.
        // I'll assume userId 1 for now or load from the active user's settings when `generate` is called?
        // The `handlers.ts` will receive IPC from a renderer which has a logged-in user.

        // Let's stick to: Registry doesn't manage keys. Provider manages keys.
        // For MVP/Phase 4.1: I'll initialize them with empty keys.
        // AND in `handlers.ts`, when `ai:generate` is called, I'll fetch the user's settings and update the provider OR pass key.
        // Passing key per request is safer for multi-user.
        // I should probably update `AIProvider` to allow passing config in `generate`.
        // OR, just update `initialize` before `generate`? No, race conditions.

        // Solution: Add `apiKey` to `AIRequestOptions`.
        // I'll update `base.provider.ts` and implementations to check options.apiKey first.

    } catch (e) {
        console.error('Failed to load AI settings', e);
    }
}

