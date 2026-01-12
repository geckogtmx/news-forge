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
}

