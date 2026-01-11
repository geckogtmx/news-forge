import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';
import type { Run, InsertRun } from '../../electron/main/db/schema';

export function useRuns() {
    const { invoke, loading, error } = useIpc<Run | Run[] | boolean | any>();

    const createRun = useCallback(async (userId: number, stats: any = {}) => {
        return await invoke(IPC_CHANNELS.RUN.CREATE, userId, stats) as Run | undefined;
    }, [invoke]);

    const getRunById = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.RUN.GET_BY_ID, id) as Run | undefined;
    }, [invoke]);

    const getRunsByUser = useCallback(async (userId: number, limit: number = 50, offset: number = 0) => {
        return await invoke(IPC_CHANNELS.RUN.GET_BY_USER, userId, limit, offset) as Run[] | undefined;
    }, [invoke]);

    const getLatestRun = useCallback(async (userId: number) => {
        return await invoke(IPC_CHANNELS.RUN.GET_LATEST, userId) as Run | undefined;
    }, [invoke]);

    const updateRunStatus = useCallback(async (id: number, status: string) => {
        return await invoke(IPC_CHANNELS.RUN.UPDATE_STATUS, id, status) as Run | undefined;
    }, [invoke]);

    const updateRunStats = useCallback(async (id: number, stats: any) => {
        return await invoke(IPC_CHANNELS.RUN.UPDATE_STATS, id, stats) as Run | undefined;
    }, [invoke]);

    const completeRun = useCallback(async (id: number, finalStats?: any) => {
        return await invoke(IPC_CHANNELS.RUN.COMPLETE, id, finalStats) as Run | undefined;
    }, [invoke]);

    const failRun = useCallback(async (id: number, errorMessage: string) => {
        return await invoke(IPC_CHANNELS.RUN.FAIL, id, errorMessage) as Run | undefined;
    }, [invoke]);

    const getRunStatistics = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.RUN.GET_STATISTICS, id) as any | undefined;
    }, [invoke]);

    const deleteRun = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.RUN.DELETE, id) as boolean | undefined;
    }, [invoke]);

    return {
        createRun,
        getRunById,
        getRunsByUser,
        getLatestRun,
        updateRunStatus,
        updateRunStats,
        completeRun,
        failRun,
        getRunStatistics,
        deleteRun,
        loading,
        error,
    };
}
