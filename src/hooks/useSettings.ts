import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';
import type { UserSettings } from '../../electron/main/db/schema';

export function useSettings() {
    const { invoke, loading, error } = useIpc<UserSettings>();

    const getSettings = useCallback(async (userId: number) => {
        return await invoke(IPC_CHANNELS.SETTINGS.GET, userId) as UserSettings | undefined;
    }, [invoke]);

    const updateSettings = useCallback(async (userId: number, data: Partial<UserSettings>) => {
        return await invoke(IPC_CHANNELS.SETTINGS.UPDATE, userId, data) as UserSettings | undefined;
    }, [invoke]);

    const updateObsidianPath = useCallback(async (userId: number, path: string) => {
        return await invoke(IPC_CHANNELS.SETTINGS.UPDATE_OBSIDIAN_PATH, userId, path) as UserSettings | undefined;
    }, [invoke]);

    const updateDefaultModel = useCallback(async (userId: number, model: string) => {
        return await invoke(IPC_CHANNELS.SETTINGS.UPDATE_MODEL, userId, model) as UserSettings | undefined;
    }, [invoke]);

    const updateAIProvider = useCallback(async (userId: number, providerId: string, config: any) => {
        return await invoke(IPC_CHANNELS.SETTINGS.UPDATE_AI_PROVIDER, userId, providerId, config) as UserSettings | undefined;
    }, [invoke]);

    return {
        getSettings,
        updateSettings,
        updateObsidianPath,
        updateDefaultModel,
        updateAIProvider,
        loading,
        error,
    };
}
