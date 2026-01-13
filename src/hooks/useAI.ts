import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';

export interface AIModel {
    id: string;
    name: string;
    providerId: string;
    contextWindow: number;
    enabled: boolean;
}

export function useAI() {
    const { invoke, loading, error } = useIpc<any>();

    const getModels = useCallback(async (providerId?: string) => {
        return await invoke(IPC_CHANNELS.AI.GET_MODELS, providerId) as AIModel[];
    }, [invoke]);

    const generate = useCallback(async (userId: number, prompt: string, options: any, providerId?: string) => {
        return await invoke(IPC_CHANNELS.AI.GENERATE, userId, { prompt, ...options }, providerId);
    }, [invoke]);

    return {
        getModels,
        generate,
        loading,
        error
    };
}
