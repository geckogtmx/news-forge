import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';

export interface GmailFilters {
    labels?: string[];
    senders?: string[];
    subjects?: string[];
    after?: Date;
    before?: Date;
    maxResults?: number;
}

export interface ParsedEmail {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    date: Date;
    snippet: string;
    body: string;
    links: string[];
}

export interface GmailLabel {
    id: string;
    name: string;
}

export function useGmail() {
    const { invoke, loading, error } = useIpc<any>();

    const isConfigured = useCallback(async () => {
        return await invoke(IPC_CHANNELS.GMAIL.IS_CONFIGURED) as boolean | undefined;
    }, [invoke]);

    const isAuthenticated = useCallback(async (userId: number) => {
        return await invoke(IPC_CHANNELS.GMAIL.IS_AUTHENTICATED, userId) as boolean | undefined;
    }, [invoke]);

    const getAuthUrl = useCallback(async () => {
        return await invoke(IPC_CHANNELS.GMAIL.GET_AUTH_URL) as string | undefined;
    }, [invoke]);

    const openAuthUrl = useCallback(async (userId: number) => {
        return await invoke(IPC_CHANNELS.GMAIL.OPEN_AUTH_URL, userId) as boolean | undefined;
    }, [invoke]);

    const handleCallback = useCallback(async (code: string, userId: number) => {
        return await invoke(IPC_CHANNELS.GMAIL.HANDLE_CALLBACK, code, userId);
    }, [invoke]);

    const revokeAuth = useCallback(async (userId: number) => {
        return await invoke(IPC_CHANNELS.GMAIL.REVOKE_AUTH, userId) as boolean | undefined;
    }, [invoke]);

    const fetchNewsletters = useCallback(async (userId: number, filters: GmailFilters = {}) => {
        return await invoke(IPC_CHANNELS.GMAIL.FETCH_NEWSLETTERS, userId, filters) as ParsedEmail[] | undefined;
    }, [invoke]);

    const getLabels = useCallback(async (userId: number) => {
        return await invoke(IPC_CHANNELS.GMAIL.GET_LABELS, userId) as GmailLabel[] | undefined;
    }, [invoke]);

    const testConnection = useCallback(async (userId: number, filters: GmailFilters = {}) => {
        return await invoke(IPC_CHANNELS.GMAIL.TEST_CONNECTION, userId, filters) as {
            success: boolean;
            emailCount: number;
            error?: string;
        } | undefined;
    }, [invoke]);

    const extractHeadlines = useCallback(async (emails: ParsedEmail[]) => {
        return await invoke(IPC_CHANNELS.GMAIL.EXTRACT_HEADLINES, emails);
    }, [invoke]);

    return {
        isConfigured,
        isAuthenticated,
        getAuthUrl,
        openAuthUrl,
        handleCallback,
        revokeAuth,
        fetchNewsletters,
        getLabels,
        testConnection,
        extractHeadlines,
        loading,
        error,
    };
}
