import { ipcMain, IpcMainInvokeEvent } from 'electron';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { services } from '../services';
import { DEFAULT_USER_ID } from '../../shared/constants';
import { validateIpcArgs } from '../../shared/validation';

/**
 * Generic error handler for IPC calls
 */
function handleIpcError(channel: string, error: unknown) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    log.error(`[IPC Error] ${channel}:`, error);
    return { success: false, error: message };
}

/**
 * Factory function to create standardized IPC handlers.
 * Wraps service calls with consistent error handling and response format.
 */
function createHandler<TArgs extends unknown[], TResult>(
    channel: string,
    handler: (...args: TArgs) => Promise<TResult> | TResult
) {
    ipcMain.handle(channel, async (_event: IpcMainInvokeEvent, ...args: TArgs) => {
        try {
            const validatedArgs = validateIpcArgs(channel, args) as TArgs;
            const result = await handler(...validatedArgs);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(channel, error);
        }
    });
}

/**
 * Register all IPC handlers
 */
export function registerIpcHandlers() {
    // ========== USER ==========
    createHandler(IPC_CHANNELS.USER.CREATE, (data: any) => services.user.createUser(data));
    createHandler(IPC_CHANNELS.USER.GET_BY_ID, (id: number) => services.user.getUserById(id));
    createHandler(IPC_CHANNELS.USER.GET_BY_EMAIL, (email: string) => services.user.getUserByEmail(email));
    createHandler(IPC_CHANNELS.USER.GET_BY_OPEN_ID, (openId: string) => services.user.getUserByOpenId(openId));
    createHandler(IPC_CHANNELS.USER.UPDATE, (id: number, data: any) => services.user.updateUser(id, data));
    createHandler(IPC_CHANNELS.USER.DELETE, (id: number) => services.user.deleteUser(id));
    createHandler(IPC_CHANNELS.USER.GET_ALL, () => services.user.getAllUsers());
    createHandler(IPC_CHANNELS.USER.UPDATE_LAST_SIGNED_IN, (id: number) => services.user.updateLastSignedIn(id));

    // ========== NEWS SOURCE ==========
    createHandler(IPC_CHANNELS.SOURCE.CREATE, (data: any) => services.newsSource.createSource(data));
    createHandler(IPC_CHANNELS.SOURCE.GET_BY_ID, (id: number) => services.newsSource.getSourceById(id));
    createHandler(IPC_CHANNELS.SOURCE.GET_BY_USER, (userId: number) => services.newsSource.getSourcesByUser(userId));
    createHandler(IPC_CHANNELS.SOURCE.GET_ACTIVE_BY_USER, (userId: number) => services.newsSource.getActiveSourcesByUser(userId));
    createHandler(IPC_CHANNELS.SOURCE.GET_BY_TYPE, (userId: number, type: any) => services.newsSource.getSourcesByType(userId, type));
    createHandler(IPC_CHANNELS.SOURCE.UPDATE, (id: number, data: any) => services.newsSource.updateSource(id, data));
    createHandler(IPC_CHANNELS.SOURCE.TOGGLE_ACTIVE, (id: number, isActive: boolean) => services.newsSource.toggleSourceActive(id, isActive));
    createHandler(IPC_CHANNELS.SOURCE.DELETE, (id: number) => services.newsSource.deleteSource(id));
    createHandler(IPC_CHANNELS.SOURCE.BULK_TOGGLE, (ids: number[], isActive: boolean) => services.newsSource.bulkToggleSources(ids, isActive));
    createHandler(IPC_CHANNELS.SOURCE.VALIDATE_CONFIG, (type: any, config: any) => services.newsSource.validateSourceConfig(type, config));

    // ========== RUN ==========
    createHandler(IPC_CHANNELS.RUN.CREATE, (userId: number, stats?: any) => services.run.createRun(userId, stats));
    createHandler(IPC_CHANNELS.RUN.GET_BY_ID, (id: number) => services.run.getRunById(id));
    createHandler(IPC_CHANNELS.RUN.GET_BY_USER, (userId: number, limit?: number, offset?: number) => services.run.getRunsByUser(userId, limit, offset));
    createHandler(IPC_CHANNELS.RUN.GET_BY_STATUS, (userId: number, status: any) => services.run.getRunsByStatus(userId, status));
    createHandler(IPC_CHANNELS.RUN.GET_LATEST, (userId: number) => services.run.getLatestRun(userId));
    createHandler(IPC_CHANNELS.RUN.UPDATE_STATUS, (id: number, status: any) => services.run.updateRunStatus(id, status));
    createHandler(IPC_CHANNELS.RUN.UPDATE_STATS, (id: number, stats: any) => services.run.updateRunStats(id, stats));
    createHandler(IPC_CHANNELS.RUN.COMPLETE, (id: number, finalStats?: any) => services.run.completeRun(id, finalStats));
    createHandler(IPC_CHANNELS.RUN.FAIL, (id: number, errorMsg: string) => services.run.failRun(id, errorMsg));
    createHandler(IPC_CHANNELS.RUN.GET_STATISTICS, (id: number) => services.run.getRunStatistics(id));
    createHandler(IPC_CHANNELS.RUN.DELETE, (id: number) => services.run.deleteRun(id));

    // ========== HEADLINE ==========
    createHandler(IPC_CHANNELS.HEADLINE.CREATE, (data: any) => services.headline.createHeadline(data));
    createHandler(IPC_CHANNELS.HEADLINE.CREATE_BULK, (headlines: any[]) => services.headline.createHeadlines(headlines));
    createHandler(IPC_CHANNELS.HEADLINE.GET_BY_ID, (id: number) => services.headline.getHeadlineById(id));
    createHandler(IPC_CHANNELS.HEADLINE.GET_BY_RUN, (runId: number, filters?: any) => services.headline.getHeadlinesByRun(runId, filters));
    createHandler(IPC_CHANNELS.HEADLINE.GET_SELECTED, (runId: number) => services.headline.getSelectedHeadlines(runId));
    createHandler(IPC_CHANNELS.HEADLINE.TOGGLE_SELECTION, (id: number, selected: boolean) => services.headline.toggleHeadlineSelection(id, selected));
    createHandler(IPC_CHANNELS.HEADLINE.BULK_SELECT, (ids: number[], selected: boolean) => services.headline.bulkSelectHeadlines(ids, selected));
    createHandler(IPC_CHANNELS.HEADLINE.SEARCH, (runId: number, query: string) => services.headline.searchHeadlines(runId, query));
    createHandler(IPC_CHANNELS.HEADLINE.DELETE, (ids: number[]) => services.headline.deleteHeadlines(ids));
    createHandler(IPC_CHANNELS.HEADLINE.GET_BY_IDS, (ids: number[]) => services.headline.getHeadlinesByIds(ids));

    // ========== COMPILED ITEMS ==========
    createHandler(IPC_CHANNELS.COMPILED.CREATE, (data: any) => services.compiledItem.createCompiledItem(data));
    createHandler(IPC_CHANNELS.COMPILED.CREATE_BULK, (items: any[]) => services.compiledItem.bulkCreateCompiledItems(items));
    createHandler(IPC_CHANNELS.COMPILED.GET_BY_ID, (id: number) => services.compiledItem.getCompiledItemById(id));
    createHandler(IPC_CHANNELS.COMPILED.GET_BY_RUN, (runId: number) => services.compiledItem.getCompiledItemsByRun(runId));
    createHandler(IPC_CHANNELS.COMPILED.GET_SELECTED, (runId: number) => services.compiledItem.getSelectedCompiledItems(runId));
    createHandler(IPC_CHANNELS.COMPILED.UPDATE, (id: number, data: any) => services.compiledItem.updateCompiledItem(id, data));
    createHandler(IPC_CHANNELS.COMPILED.TOGGLE_SELECTION, (id: number, selected: boolean) => services.compiledItem.toggleSelection(id, selected));
    createHandler(IPC_CHANNELS.COMPILED.DELETE, (id: number) => services.compiledItem.deleteCompiledItem(id));
    createHandler(IPC_CHANNELS.COMPILED.SEARCH, (runId: number, query: string) => services.compiledItem.searchCompiledItems(runId, query));

    // COMPILED.GET_RELATED_HEADLINES needs custom logic (two service calls)
    ipcMain.handle(IPC_CHANNELS.COMPILED.GET_RELATED_HEADLINES, async (_event, id: number) => {
        try {
            const headlineIds = await services.compiledItem.getRelatedHeadlineIds(id);
            const headlines = await services.headline.getHeadlinesByIds(headlineIds);
            return { success: true, data: headlines };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.GET_RELATED_HEADLINES, error);
        }
    });

    // ========== CONTENT PACKAGES ==========
    createHandler(IPC_CHANNELS.PACKAGE.CREATE, (data: any) => services.contentPackage.createPackage(data));
    createHandler(IPC_CHANNELS.PACKAGE.CREATE_BULK, (packages: any[]) => services.contentPackage.bulkCreatePackages(packages));
    createHandler(IPC_CHANNELS.PACKAGE.GET_BY_ID, (id: number) => services.contentPackage.getPackageById(id));
    createHandler(IPC_CHANNELS.PACKAGE.GET_BY_RUN, (runId: number) => services.contentPackage.getPackagesByRun(runId));
    createHandler(IPC_CHANNELS.PACKAGE.GET_BY_COMPILED_ITEM, (compiledItemId: number) => services.contentPackage.getPackageByCompiledItem(compiledItemId));
    createHandler(IPC_CHANNELS.PACKAGE.GET_BY_STATUS, (runId: number, status: any) => services.contentPackage.getPackagesByStatus(runId, status));
    createHandler(IPC_CHANNELS.PACKAGE.UPDATE, (id: number, data: any) => services.contentPackage.updatePackage(id, data));
    createHandler(IPC_CHANNELS.PACKAGE.UPDATE_CONTENT, (id: number, content: any) => services.contentPackage.updatePackageContent(id, content));
    createHandler(IPC_CHANNELS.PACKAGE.MARK_EXPORTED, (id: number) => services.contentPackage.markPackageExported(id));
    createHandler(IPC_CHANNELS.PACKAGE.MARK_READY, (id: number) => services.contentPackage.markPackageReady(id));
    createHandler(IPC_CHANNELS.PACKAGE.DELETE, (id: number) => services.contentPackage.deletePackage(id));
    createHandler(IPC_CHANNELS.PACKAGE.GENERATE, (packageId: number, userId: number, modelId?: string, providerId?: string) =>
        services.contentPackage.generatePackageContent(packageId, userId, modelId, providerId));

    // ========== ARCHIVE ==========
    createHandler(IPC_CHANNELS.ARCHIVE.CREATE, (data: any) => services.archive.createArchive(data));
    createHandler(IPC_CHANNELS.ARCHIVE.GET_BY_ID, (id: number) => services.archive.getArchiveById(id));
    createHandler(IPC_CHANNELS.ARCHIVE.GET_BY_USER, (userId: number) => services.archive.getArchivesByUser(userId));
    createHandler(IPC_CHANNELS.ARCHIVE.GET_BY_RUN, (runId: number) => services.archive.getArchiveByRun(runId));
    createHandler(IPC_CHANNELS.ARCHIVE.UPDATE, (id: number, data: any) => services.archive.updateArchive(id, data));
    createHandler(IPC_CHANNELS.ARCHIVE.UPDATE_OBSIDIAN_PATH, (id: number, obsidianPath: string) => services.archive.updateObsidianPath(id, obsidianPath));
    createHandler(IPC_CHANNELS.ARCHIVE.DELETE, (id: number) => services.archive.deleteArchive(id));
    createHandler(IPC_CHANNELS.ARCHIVE.GET_RECENT, (userId: number, limit?: number) => services.archive.getRecentArchives(userId, limit));

    // ========== SETTINGS ==========
    createHandler(IPC_CHANNELS.SETTINGS.GET, (userId: number) => services.settings.getSettings(userId));
    createHandler(IPC_CHANNELS.SETTINGS.UPDATE, (userId: number, data: any) => services.settings.updateSettings(userId, data));
    createHandler(IPC_CHANNELS.SETTINGS.UPDATE_OBSIDIAN_PATH, (userId: number, path: string) => services.settings.updateObsidianPath(userId, path));
    createHandler(IPC_CHANNELS.SETTINGS.UPDATE_MODEL, (userId: number, model: string) => services.settings.updateDefaultModel(userId, model));
    createHandler(IPC_CHANNELS.SETTINGS.UPDATE_TONE, (userId: number, tone: string) => services.settings.updateTone(userId, tone));
    createHandler(IPC_CHANNELS.SETTINGS.UPDATE_FORMAT, (userId: number, format: any) => services.settings.updateFormat(userId, format));
    createHandler(IPC_CHANNELS.SETTINGS.RESET, (userId: number) => services.settings.resetSettings(userId));
    createHandler(IPC_CHANNELS.SETTINGS.UPDATE_AI_PROVIDER, (userId: number, providerId: string, config: any) =>
        services.settings.updateAIProvider(userId, providerId, config));

    // ========== RSS ==========
    createHandler(IPC_CHANNELS.RSS.FETCH_FEED, (url: string) => services.rss.fetchFeed(url));
    createHandler(IPC_CHANNELS.RSS.DISCOVER_FEEDS, (websiteUrl: string) => services.rss.discoverFeeds(websiteUrl));
    createHandler(IPC_CHANNELS.RSS.VALIDATE_FEED, (url: string) => services.rss.validateFeed(url));

    // RSS.PREVIEW_FEED needs custom logic (slice items)
    ipcMain.handle(IPC_CHANNELS.RSS.PREVIEW_FEED, async (_event, url: string) => {
        try {
            const [validatedUrl] = validateIpcArgs(IPC_CHANNELS.RSS.PREVIEW_FEED, [url]) as [string];
            const feed = await services.rss.fetchFeed(validatedUrl);
            return { success: true, data: { ...feed, items: feed.items.slice(0, 5) } };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RSS.PREVIEW_FEED, error);
        }
    });

    // ========== GMAIL ==========
    createHandler(IPC_CHANNELS.GMAIL.IS_CONFIGURED, () => services.gmail.isConfigured());
    createHandler(IPC_CHANNELS.GMAIL.IS_AUTHENTICATED, (userId: number) => services.gmail.isAuthenticated(userId));
    createHandler(IPC_CHANNELS.GMAIL.GET_AUTH_URL, () => services.gmail.getAuthUrl());
    createHandler(IPC_CHANNELS.GMAIL.OPEN_AUTH_URL, (userId: number) => services.gmail.openAuthUrl(userId));
    createHandler(IPC_CHANNELS.GMAIL.HANDLE_CALLBACK, (code: string, userId: number) => services.gmail.handleAuthCallback(code, userId));
    createHandler(IPC_CHANNELS.GMAIL.REVOKE_AUTH, (userId: number) => services.gmail.revokeAuth(userId));
    createHandler(IPC_CHANNELS.GMAIL.FETCH_NEWSLETTERS, (userId: number, filters: any) => services.gmail.fetchNewsletters(userId, filters));
    createHandler(IPC_CHANNELS.GMAIL.GET_LABELS, (userId: number) => services.gmail.getLabels(userId));
    createHandler(IPC_CHANNELS.GMAIL.TEST_CONNECTION, (userId: number, filters: any) => services.gmail.testConnection(userId, filters));
    createHandler(IPC_CHANNELS.GMAIL.EXTRACT_HEADLINES, (emails: any[]) => services.gmail.extractHeadlines(emails));

    // ========== YOUTUBE ==========
    createHandler(IPC_CHANNELS.YOUTUBE.VALIDATE_URL, (url: string) => services.youtube.isValidYoutubeUrl(url));
    createHandler(IPC_CHANNELS.YOUTUBE.EXTRACT_VIDEO_ID, (url: string) => services.youtube.extractVideoId(url));
    createHandler(IPC_CHANNELS.YOUTUBE.FETCH_VIDEO, (url: string) => services.youtube.fetchVideoMetadata(url));
    createHandler(IPC_CHANNELS.YOUTUBE.PREVIEW_VIDEO, (url: string) => services.youtube.previewVideo(url));

    // YOUTUBE.EXTRACT_HEADLINE needs custom logic
    ipcMain.handle(IPC_CHANNELS.YOUTUBE.EXTRACT_HEADLINE, async (_event, url: string) => {
        try {
            const [validatedUrl] = validateIpcArgs(IPC_CHANNELS.YOUTUBE.EXTRACT_HEADLINE, [url]) as [string];
            const preview = await services.youtube.previewVideo(validatedUrl);
            return { success: true, data: preview.headline };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.YOUTUBE.EXTRACT_HEADLINE, error);
        }
    });

    // ========== FETCH COORDINATOR ==========
    createHandler(IPC_CHANNELS.FETCH.RUN_ALL_SOURCES, (userId: number) => services.fetchCoordinator.runFetchForAllSources(userId));

    // ========== COMPILATION ==========
    // GROUP_HEADLINES needs custom logic (fetch headlines first, then group)
    ipcMain.handle(IPC_CHANNELS.COMPILATION.GROUP_HEADLINES, async (_event, runId: number, options?: any) => {
        try {
            const headlines = await services.headline.getSelectedHeadlines(runId);
            const groups = await services.compilation.groupHeadlines(headlines, options);
            return { success: true, data: groups };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILATION.GROUP_HEADLINES, error);
        }
    });

    createHandler(IPC_CHANNELS.COMPILATION.GENERATE_COMPILATION, (headlineGroup: any, runId: number, options: any) =>
        services.compilation.generateCompilation(headlineGroup, runId, options));
    createHandler(IPC_CHANNELS.COMPILATION.COMPILE_RUN, (runId: number, options: any) =>
        services.compilation.compileRun(runId, options));

    // ========== AI ==========
    // AI.GET_MODELS needs custom logic (fetch settings for API keys)
    ipcMain.handle(IPC_CHANNELS.AI.GET_MODELS, async (_event, providerId?: string) => {
        try {
            const settings = await services.settings.getSecureSettings(DEFAULT_USER_ID);
            const providerKeys: Record<string, string> = {};

            if (settings?.aiProviders) {
                const providers = settings.aiProviders as Record<string, any>;
                for (const [id, config] of Object.entries(providers)) {
                    if (config.apiKey) {
                        providerKeys[id] = config.apiKey;
                    }
                }
            }

            const models = await services.aiRegistry.getAllModels(providerKeys, providerId);
            return { success: true, data: models };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : String(error);
            log.error('[IPC] Error fetching models:', error);
            return { success: false, data: [], error: message };
        }
    });

    // AI.GENERATE needs custom logic (fetch settings, resolve API key)
    ipcMain.handle(IPC_CHANNELS.AI.GENERATE, async (_event, userId: number, options: any, providerId?: string) => {
        try {
            const settings = await services.settings.getSecureSettings(userId);
            const aiProviders = settings.aiProviders as Record<string, any>;

            let apiKey = options.apiKey;
            let targetProviderId = providerId;

            if (!apiKey) {
                if (!targetProviderId && options.modelId) {
                    const allModels = await services.aiRegistry.getAllModels();
                    const model = allModels.find((m: any) => m.id === options.modelId);
                    if (model) targetProviderId = model.providerId;
                }

                if (targetProviderId && aiProviders?.[targetProviderId]) {
                    apiKey = aiProviders[targetProviderId].apiKey;
                }
            }

            const result = await services.aiRegistry.generate({ ...options, apiKey }, providerId);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.AI.GENERATE, error);
        }
    });

    log.info('[IPC] All handlers registered');
}
