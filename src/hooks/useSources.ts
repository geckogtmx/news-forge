import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';
import type { NewsSource, InsertNewsSource } from '../../electron/main/db/schema';

export function useSources() {
    const { invoke, loading, error } = useIpc<NewsSource | NewsSource[] | number | { valid: boolean, errors?: string[] }>();

    const createSource = useCallback(async (data: Omit<InsertNewsSource, 'id' | 'createdAt' | 'updatedAt'>) => {
        return await invoke(IPC_CHANNELS.SOURCE.CREATE, data) as NewsSource | undefined;
    }, [invoke]);

    const getSourceById = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.SOURCE.GET_BY_ID, id) as NewsSource | undefined;
    }, [invoke]);

    const getSourcesByUser = useCallback(async (userId: number) => {
        return await invoke(IPC_CHANNELS.SOURCE.GET_BY_USER, userId) as NewsSource[] | undefined;
    }, [invoke]);

    const getActiveSourcesByUser = useCallback(async (userId: number) => {
        return await invoke(IPC_CHANNELS.SOURCE.GET_ACTIVE_BY_USER, userId) as NewsSource[] | undefined;
    }, [invoke]);

    const updateSource = useCallback(async (id: number, data: Partial<NewsSource>) => {
        return await invoke(IPC_CHANNELS.SOURCE.UPDATE, id, data) as NewsSource | undefined;
    }, [invoke]);

    const toggleSourceActive = useCallback(async (id: number, isActive: boolean) => {
        return await invoke(IPC_CHANNELS.SOURCE.TOGGLE_ACTIVE, id, isActive) as NewsSource | undefined;
    }, [invoke]);

    const deleteSource = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.SOURCE.DELETE, id) as boolean | undefined;
    }, [invoke]);

    const validateConfig = useCallback(async (type: string, config: any) => {
        return await invoke(IPC_CHANNELS.SOURCE.VALIDATE_CONFIG, type, config) as { valid: boolean, errors?: string[] } | undefined;
    }, [invoke]);

    return {
        createSource,
        getSourceById,
        getSourcesByUser,
        getActiveSourcesByUser,
        updateSource,
        toggleSourceActive,
        deleteSource,
        validateConfig,
        loading,
        error,
    };
}
