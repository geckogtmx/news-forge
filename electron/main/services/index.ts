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

export {
    userService, UserService,
    newsSourceService, NewsSourceService,
    runService, RunService,
    headlineService, HeadlineService,
    compiledItemService, CompiledItemService,
    contentPackageService, ContentPackageService,
    archiveService, ArchiveService,
    settingsService, SettingsService,
    progressService, ProgressService,
    rssService, RssService,
    gmailService,
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
};

