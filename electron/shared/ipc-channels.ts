/**
 * IPC Channel Constants
 * 
 * Centralized definition of all IPC channels used for main ↔ renderer communication.
 * Using constants helps prevent typos and makes refactoring easier.
 */

// User channels
export const USER_CHANNELS = {
    CREATE: 'user:create',
    GET_BY_ID: 'user:get-by-id',
    GET_BY_EMAIL: 'user:get-by-email',
    GET_BY_OPEN_ID: 'user:get-by-open-id',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    GET_ALL: 'user:get-all',
    UPDATE_LAST_SIGNED_IN: 'user:update-last-signed-in',
} as const;

// News source channels
export const SOURCE_CHANNELS = {
    CREATE: 'source:create',
    GET_BY_ID: 'source:get-by-id',
    GET_BY_USER: 'source:get-by-user',
    GET_ACTIVE_BY_USER: 'source:get-active-by-user',
    GET_BY_TYPE: 'source:get-by-type',
    UPDATE: 'source:update',
    TOGGLE_ACTIVE: 'source:toggle-active',
    DELETE: 'source:delete',
    BULK_TOGGLE: 'source:bulk-toggle',
    VALIDATE_CONFIG: 'source:validate-config',
} as const;

// Run channels
export const RUN_CHANNELS = {
    CREATE: 'run:create',
    GET_BY_ID: 'run:get-by-id',
    GET_BY_USER: 'run:get-by-user',
    GET_BY_STATUS: 'run:get-by-status',
    GET_LATEST: 'run:get-latest',
    UPDATE_STATUS: 'run:update-status',
    UPDATE_STATS: 'run:update-stats',
    COMPLETE: 'run:complete',
    FAIL: 'run:fail',
    GET_STATISTICS: 'run:get-statistics',
    DELETE: 'run:delete',
} as const;

// Headline channels
export const HEADLINE_CHANNELS = {
    CREATE: 'headline:create',
    CREATE_BULK: 'headline:create-bulk',
    GET_BY_ID: 'headline:get-by-id',
    GET_BY_RUN: 'headline:get-by-run',
    GET_SELECTED: 'headline:get-selected',
    TOGGLE_SELECTION: 'headline:toggle-selection',
    BULK_SELECT: 'headline:bulk-select',
    SEARCH: 'headline:search',
    DELETE: 'headline:delete',
    DELETE_BULK: 'headline:delete-bulk',
    GET_BY_IDS: 'headline:get-by-ids',
} as const;

// Compiled item channels
export const COMPILED_CHANNELS = {
    CREATE: 'compiled:create',
    CREATE_BULK: 'compiled:create-bulk',
    GET_BY_ID: 'compiled:get-by-id',
    GET_BY_RUN: 'compiled:get-by-run',
    GET_SELECTED: 'compiled:get-selected',
    UPDATE: 'compiled:update',
    TOGGLE_SELECTION: 'compiled:toggle-selection',
    DELETE: 'compiled:delete',
    SEARCH: 'compiled:search',
    GET_RELATED_HEADLINES: 'compiled:get-related-headlines',
} as const;

// Content package channels
export const PACKAGE_CHANNELS = {
    CREATE: 'package:create',
    CREATE_BULK: 'package:create-bulk',
    GET_BY_ID: 'package:get-by-id',
    GET_BY_RUN: 'package:get-by-run',
    GET_BY_COMPILED_ITEM: 'package:get-by-compiled-item',
    GET_BY_STATUS: 'package:get-by-status',
    UPDATE: 'package:update',
    UPDATE_CONTENT: 'package:update-content',
    MARK_EXPORTED: 'package:mark-exported',
    MARK_READY: 'package:mark-ready',
    DELETE: 'package:delete',
} as const;

// Archive channels
export const ARCHIVE_CHANNELS = {
    CREATE: 'archive:create',
    GET_BY_ID: 'archive:get-by-id',
    GET_BY_USER: 'archive:get-by-user',
    GET_BY_RUN: 'archive:get-by-run',
    UPDATE: 'archive:update',
    UPDATE_OBSIDIAN_PATH: 'archive:update-obsidian-path',
    DELETE: 'archive:delete',
    GET_RECENT: 'archive:get-recent',
} as const;

// Settings channels
export const SETTINGS_CHANNELS = {
    GET: 'settings:get',
    UPDATE: 'settings:update',
    UPDATE_OBSIDIAN_PATH: 'settings:update-obsidian-path',
    UPDATE_MODEL: 'settings:update-model',
    UPDATE_TONE: 'settings:update-tone',
    UPDATE_FORMAT: 'settings:update-format',
    RESET: 'settings:reset',
} as const;

// Progress event channels (one-way from main to renderer)
export const PROGRESS_CHANNELS = {
    RUN_PROGRESS: 'progress:run',
    COMPILE_PROGRESS: 'progress:compile',
    EXPORT_PROGRESS: 'progress:export',
} as const;

// RSS channels
export const RSS_CHANNELS = {
    FETCH_FEED: 'rss:fetch-feed',
    DISCOVER_FEEDS: 'rss:discover-feeds',
    VALIDATE_FEED: 'rss:validate-feed',
    PREVIEW_FEED: 'rss:preview-feed',
} as const;

// Gmail channels
export const GMAIL_CHANNELS = {
    IS_CONFIGURED: 'gmail:is-configured',
    IS_AUTHENTICATED: 'gmail:is-authenticated',
    GET_AUTH_URL: 'gmail:get-auth-url',
    OPEN_AUTH_URL: 'gmail:open-auth-url',
    HANDLE_CALLBACK: 'gmail:handle-callback',
    REVOKE_AUTH: 'gmail:revoke-auth',
    FETCH_NEWSLETTERS: 'gmail:fetch-newsletters',
    GET_LABELS: 'gmail:get-labels',
    TEST_CONNECTION: 'gmail:test-connection',
    EXTRACT_HEADLINES: 'gmail:extract-headlines',
} as const;

// Combine all channels for easy access
export const IPC_CHANNELS = {
    USER: USER_CHANNELS,
    SOURCE: SOURCE_CHANNELS,
    RUN: RUN_CHANNELS,
    HEADLINE: HEADLINE_CHANNELS,
    COMPILED: COMPILED_CHANNELS,
    PACKAGE: PACKAGE_CHANNELS,
    ARCHIVE: ARCHIVE_CHANNELS,
    SETTINGS: SETTINGS_CHANNELS,
    PROGRESS: PROGRESS_CHANNELS,
    RSS: RSS_CHANNELS,
    GMAIL: GMAIL_CHANNELS,
} as const;

