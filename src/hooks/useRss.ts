import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';

interface FeedItem {
    title?: string;
    link?: string;
    content?: string;
    contentSnippet?: string;
    pubDate?: string;
    isoDate?: string;
}

interface Feed {
    title?: string;
    description?: string;
    link?: string;
    items: FeedItem[];
}

interface DiscoveredFeed {
    url: string;
    title?: string;
    type: 'rss' | 'atom' | 'json';
}

interface FeedValidation {
    valid: boolean;
    error?: string;
    title?: string;
}

export function useRss() {
    const { invoke, loading, error } = useIpc<Feed | DiscoveredFeed[] | FeedValidation>();

    const fetchFeed = useCallback(async (url: string) => {
        return await invoke(IPC_CHANNELS.RSS.FETCH_FEED, url) as Feed | undefined;
    }, [invoke]);

    const discoverFeeds = useCallback(async (websiteUrl: string) => {
        return await invoke(IPC_CHANNELS.RSS.DISCOVER_FEEDS, websiteUrl) as DiscoveredFeed[] | undefined;
    }, [invoke]);

    const validateFeed = useCallback(async (url: string) => {
        return await invoke(IPC_CHANNELS.RSS.VALIDATE_FEED, url) as FeedValidation | undefined;
    }, [invoke]);

    const previewFeed = useCallback(async (url: string) => {
        return await invoke(IPC_CHANNELS.RSS.PREVIEW_FEED, url) as Feed | undefined;
    }, [invoke]);

    return {
        fetchFeed,
        discoverFeeds,
        validateFeed,
        previewFeed,
        loading,
        error,
    };
}
