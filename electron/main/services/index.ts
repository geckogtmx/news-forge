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
import { compilationService, CompilationService } from './compilation.service';
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
    compilationService, CompilationService,
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
    compilation: compilationService,
    aiRegistry: aiRegistry,
};

/**
 * Initialize all services
 */
export async function initializeServices() {
    const log = (await import('electron-log')).default;

    // Initialize Gemini service with API key from environment
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
        try {
            services.gemini.initialize(geminiApiKey);
        } catch (error) {
            log.error('[Services] Failed to initialize Gemini service:', error);
        }
    }

    // Initialize AI Registry with all providers
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

    log.info('[Services] All services initialized');
}

