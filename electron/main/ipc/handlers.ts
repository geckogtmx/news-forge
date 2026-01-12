import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { services } from '../services';

/**
 * IPC Handlers - Main process handlers for all IPC communication
 * 
 * This file registers all IPC handlers that respond to renderer process requests.
 * Each handler wraps service calls with error handling and logging.
 */

/**
 * Generic error handler for IPC calls
 */
function handleIpcError(channel: string, error: any) {
    console.error(`[IPC Error] ${channel}:`, error);
    return {
        success: false,
        error: error.message || 'An unknown error occurred',
    };
}

/**
 * Register all IPC handlers
 */
export function registerIpcHandlers() {
    // ============================================================
    // USER HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.USER.CREATE, async (_event, data) => {
        try {
            const user = await services.user.createUser(data);
            return { success: true, data: user };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.USER.CREATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.USER.GET_BY_ID, async (_event, id: number) => {
        try {
            const user = await services.user.getUserById(id);
            return { success: true, data: user };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.USER.GET_BY_ID, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.USER.GET_BY_EMAIL, async (_event, email: string) => {
        try {
            const user = await services.user.getUserByEmail(email);
            return { success: true, data: user };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.USER.GET_BY_EMAIL, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.USER.GET_BY_OPEN_ID, async (_event, openId: string) => {
        try {
            const user = await services.user.getUserByOpenId(openId);
            return { success: true, data: user };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.USER.GET_BY_OPEN_ID, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.USER.UPDATE, async (_event, id: number, data: any) => {
        try {
            const user = await services.user.updateUser(id, data);
            return { success: true, data: user };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.USER.UPDATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.USER.DELETE, async (_event, id: number) => {
        try {
            const result = await services.user.deleteUser(id);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.USER.DELETE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.USER.GET_ALL, async () => {
        try {
            const users = await services.user.getAllUsers();
            return { success: true, data: users };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.USER.GET_ALL, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.USER.UPDATE_LAST_SIGNED_IN, async (_event, id: number) => {
        try {
            const user = await services.user.updateLastSignedIn(id);
            return { success: true, data: user };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.USER.UPDATE_LAST_SIGNED_IN, error);
        }
    });

    // ============================================================
    // NEWS SOURCE HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.SOURCE.CREATE, async (_event, data) => {
        try {
            const source = await services.newsSource.createSource(data);
            return { success: true, data: source };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SOURCE.CREATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SOURCE.GET_BY_ID, async (_event, id: number) => {
        try {
            const source = await services.newsSource.getSourceById(id);
            return { success: true, data: source };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SOURCE.GET_BY_ID, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SOURCE.GET_BY_USER, async (_event, userId: number) => {
        try {
            const sources = await services.newsSource.getSourcesByUser(userId);
            return { success: true, data: sources };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SOURCE.GET_BY_USER, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SOURCE.GET_ACTIVE_BY_USER, async (_event, userId: number) => {
        try {
            const sources = await services.newsSource.getActiveSourcesByUser(userId);
            return { success: true, data: sources };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SOURCE.GET_ACTIVE_BY_USER, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SOURCE.GET_BY_TYPE, async (_event, userId: number, type: any) => {
        try {
            const sources = await services.newsSource.getSourcesByType(userId, type);
            return { success: true, data: sources };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SOURCE.GET_BY_TYPE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SOURCE.UPDATE, async (_event, id: number, data: any) => {
        try {
            const source = await services.newsSource.updateSource(id, data);
            return { success: true, data: source };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SOURCE.UPDATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SOURCE.TOGGLE_ACTIVE, async (_event, id: number, isActive: boolean) => {
        try {
            const source = await services.newsSource.toggleSourceActive(id, isActive);
            return { success: true, data: source };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SOURCE.TOGGLE_ACTIVE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SOURCE.DELETE, async (_event, id: number) => {
        try {
            const result = await services.newsSource.deleteSource(id);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SOURCE.DELETE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SOURCE.BULK_TOGGLE, async (_event, ids: number[], isActive: boolean) => {
        try {
            const count = await services.newsSource.bulkToggleSources(ids, isActive);
            return { success: true, data: count };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SOURCE.BULK_TOGGLE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SOURCE.VALIDATE_CONFIG, async (_event, type: any, config: any) => {
        try {
            const result = services.newsSource.validateSourceConfig(type, config);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SOURCE.VALIDATE_CONFIG, error);
        }
    });

    // ============================================================
    // RUN HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.RUN.CREATE, async (_event, userId: number, stats?: any) => {
        try {
            const run = await services.run.createRun(userId, stats);
            return { success: true, data: run };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.CREATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RUN.GET_BY_ID, async (_event, id: number) => {
        try {
            const run = await services.run.getRunById(id);
            return { success: true, data: run };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.GET_BY_ID, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RUN.GET_BY_USER, async (_event, userId: number, limit?: number, offset?: number) => {
        try {
            const runs = await services.run.getRunsByUser(userId, limit, offset);
            return { success: true, data: runs };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.GET_BY_USER, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RUN.GET_BY_STATUS, async (_event, userId: number, status: any) => {
        try {
            const runs = await services.run.getRunsByStatus(userId, status);
            return { success: true, data: runs };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.GET_BY_STATUS, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RUN.GET_LATEST, async (_event, userId: number) => {
        try {
            const run = await services.run.getLatestRun(userId);
            return { success: true, data: run };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.GET_LATEST, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RUN.UPDATE_STATUS, async (_event, id: number, status: any) => {
        try {
            const run = await services.run.updateRunStatus(id, status);
            return { success: true, data: run };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.UPDATE_STATUS, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RUN.UPDATE_STATS, async (_event, id: number, stats: any) => {
        try {
            const run = await services.run.updateRunStats(id, stats);
            return { success: true, data: run };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.UPDATE_STATS, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RUN.COMPLETE, async (_event, id: number, finalStats?: any) => {
        try {
            const run = await services.run.completeRun(id, finalStats);
            return { success: true, data: run };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.COMPLETE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RUN.FAIL, async (_event, id: number, error: string) => {
        try {
            const run = await services.run.failRun(id, error);
            return { success: true, data: run };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.FAIL, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RUN.GET_STATISTICS, async (_event, id: number) => {
        try {
            const stats = await services.run.getRunStatistics(id);
            return { success: true, data: stats };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.GET_STATISTICS, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RUN.DELETE, async (_event, id: number) => {
        try {
            const result = await services.run.deleteRun(id);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RUN.DELETE, error);
        }
    });

    // ============================================================
    // HEADLINE HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.HEADLINE.CREATE, async (_event, data) => {
        try {
            const headline = await services.headline.createHeadline(data);
            return { success: true, data: headline };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.HEADLINE.CREATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.HEADLINE.CREATE_BULK, async (_event, headlines: any[]) => {
        try {
            const result = await services.headline.createHeadlines(headlines);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.HEADLINE.CREATE_BULK, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.HEADLINE.GET_BY_ID, async (_event, id: number) => {
        try {
            const headline = await services.headline.getHeadlineById(id);
            return { success: true, data: headline };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.HEADLINE.GET_BY_ID, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.HEADLINE.GET_BY_RUN, async (_event, runId: number, filters?: any) => {
        try {
            const headlines = await services.headline.getHeadlinesByRun(runId, filters);
            return { success: true, data: headlines };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.HEADLINE.GET_BY_RUN, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.HEADLINE.GET_SELECTED, async (_event, runId: number) => {
        try {
            const headlines = await services.headline.getSelectedHeadlines(runId);
            return { success: true, data: headlines };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.HEADLINE.GET_SELECTED, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.HEADLINE.TOGGLE_SELECTION, async (_event, id: number, selected: boolean) => {
        try {
            const headline = await services.headline.toggleHeadlineSelection(id, selected);
            return { success: true, data: headline };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.HEADLINE.TOGGLE_SELECTION, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.HEADLINE.BULK_SELECT, async (_event, ids: number[], selected: boolean) => {
        try {
            const count = await services.headline.bulkSelectHeadlines(ids, selected);
            return { success: true, data: count };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.HEADLINE.BULK_SELECT, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.HEADLINE.SEARCH, async (_event, runId: number, query: string) => {
        try {
            const headlines = await services.headline.searchHeadlines(runId, query);
            return { success: true, data: headlines };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.HEADLINE.SEARCH, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.HEADLINE.DELETE, async (_event, ids: number[]) => {
        try {
            const count = await services.headline.deleteHeadlines(ids);
            return { success: true, data: count };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.HEADLINE.DELETE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.HEADLINE.GET_BY_IDS, async (_event, ids: number[]) => {
        try {
            const headlines = await services.headline.getHeadlinesByIds(ids);
            return { success: true, data: headlines };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.HEADLINE.GET_BY_IDS, error);
        }
    });

    // ============================================================
    // COMPILED ITEM HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.COMPILED.CREATE, async (_event, data) => {
        try {
            const item = await services.compiledItem.createCompiledItem(data);
            return { success: true, data: item };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.CREATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.COMPILED.CREATE_BULK, async (_event, items: any[]) => {
        try {
            const result = await services.compiledItem.bulkCreateCompiledItems(items);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.CREATE_BULK, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.COMPILED.GET_BY_ID, async (_event, id: number) => {
        try {
            const item = await services.compiledItem.getCompiledItemById(id);
            return { success: true, data: item };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.GET_BY_ID, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.COMPILED.GET_BY_RUN, async (_event, runId: number) => {
        try {
            const items = await services.compiledItem.getCompiledItemsByRun(runId);
            return { success: true, data: items };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.GET_BY_RUN, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.COMPILED.GET_SELECTED, async (_event, runId: number) => {
        try {
            const items = await services.compiledItem.getSelectedCompiledItems(runId);
            return { success: true, data: items };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.GET_SELECTED, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.COMPILED.UPDATE, async (_event, id: number, data: any) => {
        try {
            const item = await services.compiledItem.updateCompiledItem(id, data);
            return { success: true, data: item };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.UPDATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.COMPILED.TOGGLE_SELECTION, async (_event, id: number, selected: boolean) => {
        try {
            const item = await services.compiledItem.toggleSelection(id, selected);
            return { success: true, data: item };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.TOGGLE_SELECTION, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.COMPILED.DELETE, async (_event, id: number) => {
        try {
            const result = await services.compiledItem.deleteCompiledItem(id);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.DELETE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.COMPILED.SEARCH, async (_event, runId: number, query: string) => {
        try {
            const items = await services.compiledItem.searchCompiledItems(runId, query);
            return { success: true, data: items };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.SEARCH, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.COMPILED.GET_RELATED_HEADLINES, async (_event, id: number) => {
        try {
            const headlineIds = await services.compiledItem.getRelatedHeadlineIds(id);
            const headlines = await services.headline.getHeadlinesByIds(headlineIds);
            return { success: true, data: headlines };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.COMPILED.GET_RELATED_HEADLINES, error);
        }
    });

    // ============================================================
    // CONTENT PACKAGE HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.PACKAGE.CREATE, async (_event, data) => {
        try {
            const pkg = await services.contentPackage.createPackage(data);
            return { success: true, data: pkg };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.CREATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.PACKAGE.CREATE_BULK, async (_event, packages: any[]) => {
        try {
            const result = await services.contentPackage.bulkCreatePackages(packages);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.CREATE_BULK, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.PACKAGE.GET_BY_ID, async (_event, id: number) => {
        try {
            const pkg = await services.contentPackage.getPackageById(id);
            return { success: true, data: pkg };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.GET_BY_ID, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.PACKAGE.GET_BY_RUN, async (_event, runId: number) => {
        try {
            const packages = await services.contentPackage.getPackagesByRun(runId);
            return { success: true, data: packages };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.GET_BY_RUN, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.PACKAGE.GET_BY_COMPILED_ITEM, async (_event, compiledItemId: number) => {
        try {
            const pkg = await services.contentPackage.getPackageByCompiledItem(compiledItemId);
            return { success: true, data: pkg };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.GET_BY_COMPILED_ITEM, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.PACKAGE.GET_BY_STATUS, async (_event, runId: number, status: any) => {
        try {
            const packages = await services.contentPackage.getPackagesByStatus(runId, status);
            return { success: true, data: packages };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.GET_BY_STATUS, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.PACKAGE.UPDATE, async (_event, id: number, data: any) => {
        try {
            const pkg = await services.contentPackage.updatePackage(id, data);
            return { success: true, data: pkg };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.UPDATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.PACKAGE.UPDATE_CONTENT, async (_event, id: number, content: any) => {
        try {
            const pkg = await services.contentPackage.updatePackageContent(id, content);
            return { success: true, data: pkg };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.UPDATE_CONTENT, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.PACKAGE.MARK_EXPORTED, async (_event, id: number) => {
        try {
            const pkg = await services.contentPackage.markPackageExported(id);
            return { success: true, data: pkg };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.MARK_EXPORTED, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.PACKAGE.MARK_READY, async (_event, id: number) => {
        try {
            const pkg = await services.contentPackage.markPackageReady(id);
            return { success: true, data: pkg };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.MARK_READY, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.PACKAGE.DELETE, async (_event, id: number) => {
        try {
            const result = await services.contentPackage.deletePackage(id);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.PACKAGE.DELETE, error);
        }
    });

    // ============================================================
    // ARCHIVE HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.ARCHIVE.CREATE, async (_event, data) => {
        try {
            const archive = await services.archive.createArchive(data);
            return { success: true, data: archive };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.ARCHIVE.CREATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.ARCHIVE.GET_BY_ID, async (_event, id: number) => {
        try {
            const archive = await services.archive.getArchiveById(id);
            return { success: true, data: archive };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.ARCHIVE.GET_BY_ID, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.ARCHIVE.GET_BY_USER, async (_event, userId: number) => {
        try {
            const archives = await services.archive.getArchivesByUser(userId);
            return { success: true, data: archives };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.ARCHIVE.GET_BY_USER, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.ARCHIVE.GET_BY_RUN, async (_event, runId: number) => {
        try {
            const archive = await services.archive.getArchiveByRun(runId);
            return { success: true, data: archive };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.ARCHIVE.GET_BY_RUN, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.ARCHIVE.UPDATE, async (_event, id: number, data: any) => {
        try {
            const archive = await services.archive.updateArchive(id, data);
            return { success: true, data: archive };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.ARCHIVE.UPDATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.ARCHIVE.UPDATE_OBSIDIAN_PATH, async (_event, id: number, path: string) => {
        try {
            const archive = await services.archive.updateObsidianPath(id, path);
            return { success: true, data: archive };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.ARCHIVE.UPDATE_OBSIDIAN_PATH, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.ARCHIVE.DELETE, async (_event, id: number) => {
        try {
            const result = await services.archive.deleteArchive(id);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.ARCHIVE.DELETE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.ARCHIVE.GET_RECENT, async (_event, userId: number, limit?: number) => {
        try {
            const archives = await services.archive.getRecentArchives(userId, limit);
            return { success: true, data: archives };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.ARCHIVE.GET_RECENT, error);
        }
    });

    // ============================================================
    // SETTINGS HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.SETTINGS.GET, async (_event, userId: number) => {
        try {
            const settings = await services.settings.getSettings(userId);
            return { success: true, data: settings };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SETTINGS.GET, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS.UPDATE, async (_event, userId: number, data: any) => {
        try {
            const settings = await services.settings.updateSettings(userId, data);
            return { success: true, data: settings };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SETTINGS.UPDATE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS.UPDATE_OBSIDIAN_PATH, async (_event, userId: number, path: string) => {
        try {
            const settings = await services.settings.updateObsidianPath(userId, path);
            return { success: true, data: settings };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SETTINGS.UPDATE_OBSIDIAN_PATH, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS.UPDATE_MODEL, async (_event, userId: number, model: string) => {
        try {
            const settings = await services.settings.updateDefaultModel(userId, model);
            return { success: true, data: settings };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SETTINGS.UPDATE_MODEL, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS.UPDATE_TONE, async (_event, userId: number, tone: string) => {
        try {
            const settings = await services.settings.updateTone(userId, tone);
            return { success: true, data: settings };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SETTINGS.UPDATE_TONE, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS.UPDATE_FORMAT, async (_event, userId: number, format: any) => {
        try {
            const settings = await services.settings.updateFormat(userId, format);
            return { success: true, data: settings };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SETTINGS.UPDATE_FORMAT, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.SETTINGS.RESET, async (_event, userId: number) => {
        try {
            const settings = await services.settings.resetSettings(userId);
            return { success: true, data: settings };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.SETTINGS.RESET, error);
        }
    });

    // ============================================================
    // RSS HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.RSS.FETCH_FEED, async (_event, url: string) => {
        try {
            const feed = await services.rss.fetchFeed(url);
            return { success: true, data: feed };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RSS.FETCH_FEED, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RSS.DISCOVER_FEEDS, async (_event, websiteUrl: string) => {
        try {
            const feeds = await services.rss.discoverFeeds(websiteUrl);
            return { success: true, data: feeds };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RSS.DISCOVER_FEEDS, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RSS.VALIDATE_FEED, async (_event, url: string) => {
        try {
            const result = await services.rss.validateFeed(url);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RSS.VALIDATE_FEED, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.RSS.PREVIEW_FEED, async (_event, url: string) => {
        try {
            const feed = await services.rss.fetchFeed(url);
            // Return only first 5 items for preview
            const preview = {
                ...feed,
                items: feed.items.slice(0, 5),
            };
            return { success: true, data: preview };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.RSS.PREVIEW_FEED, error);
        }
    });

    // ============================================================
    // GMAIL HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.GMAIL.IS_CONFIGURED, async () => {
        try {
            const isConfigured = services.gmail.isConfigured();
            return { success: true, data: isConfigured };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.GMAIL.IS_CONFIGURED, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.GMAIL.IS_AUTHENTICATED, async (_event, userId: number) => {
        try {
            const isAuthenticated = await services.gmail.isAuthenticated(userId);
            return { success: true, data: isAuthenticated };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.GMAIL.IS_AUTHENTICATED, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.GMAIL.GET_AUTH_URL, async () => {
        try {
            const url = services.gmail.getAuthUrl();
            return { success: true, data: url };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.GMAIL.GET_AUTH_URL, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.GMAIL.OPEN_AUTH_URL, async (_event, userId: number) => {
        try {
            const result = await services.gmail.openAuthUrl(userId);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.GMAIL.OPEN_AUTH_URL, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.GMAIL.HANDLE_CALLBACK, async (_event, code: string, userId: number) => {
        try {
            const tokens = await services.gmail.handleAuthCallback(code, userId);
            return { success: true, data: tokens };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.GMAIL.HANDLE_CALLBACK, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.GMAIL.REVOKE_AUTH, async (_event, userId: number) => {
        try {
            const result = await services.gmail.revokeAuth(userId);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.GMAIL.REVOKE_AUTH, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.GMAIL.FETCH_NEWSLETTERS, async (_event, userId: number, filters: any) => {
        try {
            const emails = await services.gmail.fetchNewsletters(userId, filters);
            return { success: true, data: emails };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.GMAIL.FETCH_NEWSLETTERS, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.GMAIL.GET_LABELS, async (_event, userId: number) => {
        try {
            const labels = await services.gmail.getLabels(userId);
            return { success: true, data: labels };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.GMAIL.GET_LABELS, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.GMAIL.TEST_CONNECTION, async (_event, userId: number, filters: any) => {
        try {
            const result = await services.gmail.testConnection(userId, filters);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.GMAIL.TEST_CONNECTION, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.GMAIL.EXTRACT_HEADLINES, async (_event, emails: any[]) => {
        try {
            const headlines = services.gmail.extractHeadlines(emails);
            return { success: true, data: headlines };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.GMAIL.EXTRACT_HEADLINES, error);
        }
    });

    // ============================================================
    // YOUTUBE HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.YOUTUBE.VALIDATE_URL, async (_event, url: string) => {
        try {
            const isValid = services.youtube.isValidYoutubeUrl(url);
            return { success: true, data: isValid };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.YOUTUBE.VALIDATE_URL, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.YOUTUBE.EXTRACT_VIDEO_ID, async (_event, url: string) => {
        try {
            const videoId = services.youtube.extractVideoId(url);
            return { success: true, data: videoId };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.YOUTUBE.EXTRACT_VIDEO_ID, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.YOUTUBE.FETCH_VIDEO, async (_event, url: string) => {
        try {
            const metadata = await services.youtube.fetchVideoMetadata(url);
            return { success: true, data: metadata };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.YOUTUBE.FETCH_VIDEO, error);
        }
    });

    // ipcMain.handle(IPC_CHANNELS.YOUTUBE.FETCH_TRANSCRIPT, async (_event, videoId: string) => {
    //     try {
    //         const transcript = await services.youtube.fetchTranscript(videoId);
    //         const formatted = services.youtube.formatTranscript(transcript);
    //         return { success: true, data: formatted };
    //     } catch (error) {
    //         return handleIpcError(IPC_CHANNELS.YOUTUBE.FETCH_TRANSCRIPT, error);
    //     }
    // });

    ipcMain.handle(IPC_CHANNELS.YOUTUBE.PREVIEW_VIDEO, async (_event, url: string) => {
        try {
            const preview = await services.youtube.previewVideo(url);
            return { success: true, data: preview };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.YOUTUBE.PREVIEW_VIDEO, error);
        }
    });

    ipcMain.handle(IPC_CHANNELS.YOUTUBE.EXTRACT_HEADLINE, async (_event, url: string) => {
        try {
            const preview = await services.youtube.previewVideo(url);
            return { success: true, data: preview.headline };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.YOUTUBE.EXTRACT_HEADLINE, error);
        }
    });

    // ============================================================
    // FETCH COORDINATOR HANDLERS
    // ============================================================

    ipcMain.handle(IPC_CHANNELS.FETCH.RUN_ALL_SOURCES, async (_event, userId: number) => {
        try {
            const result = await services.fetchCoordinator.runFetchForAllSources(userId);
            return { success: true, data: result };
        } catch (error) {
            return handleIpcError(IPC_CHANNELS.FETCH.RUN_ALL_SOURCES, error);
        }
    });

    console.log('[IPC] All handlers registered successfully');
}

