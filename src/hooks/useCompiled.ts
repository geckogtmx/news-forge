import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';
import type { CompiledItem, InsertCompiledItem } from '../../electron/main/db/schema';
// We might need RawHeadline for getRelatedHeadlines return type
import type { RawHeadline } from '../../electron/main/db/schema';

export function useCompiled() {
    const { invoke, loading, error } = useIpc<CompiledItem | CompiledItem[] | RawHeadline[] | boolean>();

    const createCompiledItem = useCallback(async (data: Omit<InsertCompiledItem, 'id' | 'createdAt' | 'updatedAt'>) => {
        return await invoke(IPC_CHANNELS.COMPILED.CREATE, data) as CompiledItem | undefined;
    }, [invoke]);

    const getCompiledItemsByRun = useCallback(async (runId: number) => {
        return await invoke(IPC_CHANNELS.COMPILED.GET_BY_RUN, runId) as CompiledItem[] | undefined;
    }, [invoke]);

    const updateCompiledItem = useCallback(async (id: number, data: Partial<CompiledItem>) => {
        return await invoke(IPC_CHANNELS.COMPILED.UPDATE, id, data) as CompiledItem | undefined;
    }, [invoke]);

    const deleteCompiledItem = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.COMPILED.DELETE, id) as boolean | undefined;
    }, [invoke]);

    const getRelatedHeadlines = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.COMPILED.GET_RELATED_HEADLINES, id) as RawHeadline[] | undefined;
    }, [invoke]);

    return {
        createCompiledItem,
        getCompiledItemsByRun,
        updateCompiledItem,
        deleteCompiledItem,
        getRelatedHeadlines,
        loading,
        error,
    };
}
