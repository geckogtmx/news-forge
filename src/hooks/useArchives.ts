import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';
import type { RunArchive, InsertRunArchive } from '../../electron/main/db/schema';

export function useArchives() {
    const { invoke, loading, error } = useIpc<RunArchive | RunArchive[] | boolean>();

    const createArchive = useCallback(async (data: Omit<InsertRunArchive, 'id' | 'archivedAt'>) => {
        return await invoke(IPC_CHANNELS.ARCHIVE.CREATE, data) as RunArchive | undefined;
    }, [invoke]);

    const getArchivesByUser = useCallback(async (userId: number) => {
        return await invoke(IPC_CHANNELS.ARCHIVE.GET_BY_USER, userId) as RunArchive[] | undefined;
    }, [invoke]);

    const getArchiveByRun = useCallback(async (runId: number) => {
        return await invoke(IPC_CHANNELS.ARCHIVE.GET_BY_RUN, runId) as RunArchive | undefined;
    }, [invoke]);

    return {
        createArchive,
        getArchivesByUser,
        getArchiveByRun,
        loading,
        error,
    };
}
