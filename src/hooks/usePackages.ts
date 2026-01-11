import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';
import type { ContentPackage, InsertContentPackage } from '../../electron/main/db/schema';

export function usePackages() {
    const { invoke, loading, error } = useIpc<ContentPackage | ContentPackage[] | boolean>();

    const createPackage = useCallback(async (data: Omit<InsertContentPackage, 'id' | 'createdAt' | 'updatedAt'>) => {
        return await invoke(IPC_CHANNELS.PACKAGE.CREATE, data) as ContentPackage | undefined;
    }, [invoke]);

    const getPackagesByRun = useCallback(async (runId: number) => {
        return await invoke(IPC_CHANNELS.PACKAGE.GET_BY_RUN, runId) as ContentPackage[] | undefined;
    }, [invoke]);

    const updatePackage = useCallback(async (id: number, data: Partial<ContentPackage>) => {
        return await invoke(IPC_CHANNELS.PACKAGE.UPDATE, id, data) as ContentPackage | undefined;
    }, [invoke]);

    const updatePackageContent = useCallback(async (id: number, content: { youtubeTitle?: string; youtubeDescription?: string; scriptOutline?: string }) => {
        return await invoke(IPC_CHANNELS.PACKAGE.UPDATE_CONTENT, id, content) as ContentPackage | undefined;
    }, [invoke]);

    const markPackageExported = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.PACKAGE.MARK_EXPORTED, id) as ContentPackage | undefined;
    }, [invoke]);

    const deletePackage = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.PACKAGE.DELETE, id) as boolean | undefined;
    }, [invoke]);

    return {
        createPackage,
        getPackagesByRun,
        updatePackage,
        updatePackageContent,
        markPackageExported,
        deletePackage,
        loading,
        error,
    };
}
