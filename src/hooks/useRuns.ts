import { useCallback, useState } from 'react';
import { useIpc } from './useIpc';
import type { Run, InsertRun } from '../../electron/main/db/schema';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';

export function useRuns() {
    const { invoke, loading, error } = useIpc();
    const [run, setRun] = useState<Run>();

    const createRun = useCallback(async (userId: number, stats: any = {}) => {
        return await invoke('run:create', userId, stats) as Run | undefined;
    }, [invoke]);

    const startCollection = useCallback(async (userId: number) => {
        return await invoke(IPC_CHANNELS.FETCH.RUN_ALL_SOURCES, userId) as any; // Returns RunResult
    }, [invoke]);

    const fetchRunById = useCallback(async (id: number) => {
        const result = await invoke('run:get-by-id', id) as Run | undefined;
        if (result) {
            setRun(result);
        }
        return result;
    }, [invoke]);

    const getRunById = useCallback(async (id: number) => {
        return await invoke('run:get-by-id', id) as Run | undefined;
    }, [invoke]);

    const getRunsByUser = useCallback(async (userId: number, limit: number = 50, offset: number = 0) => {
        return await invoke('run:get-by-user', userId, limit, offset) as Run[] | undefined;
    }, [invoke]);

    const getLatestRun = useCallback(async (userId: number) => {
        return await invoke('run:get-latest', userId) as Run | undefined;
    }, [invoke]);

    const updateRunStatus = useCallback(async (id: number, status: string) => {
        return await invoke('run:update-status', id, status) as Run | undefined;
    }, [invoke]);

    const updateRunStats = useCallback(async (id: number, stats: any) => {
        return await invoke('run:update-stats', id, stats) as Run | undefined;
    }, [invoke]);

    const completeRun = useCallback(async (id: number, finalStats?: any) => {
        return await invoke('run:complete', id, finalStats) as Run | undefined;
    }, [invoke]);

    const failRun = useCallback(async (id: number, errorMessage: string) => {
        return await invoke('run:fail', id, errorMessage) as Run | undefined;
    }, [invoke]);

    const getRunStatistics = useCallback(async (id: number) => {
        return await invoke('run:get-statistics', id) as any | undefined;
    }, [invoke]);

    const deleteRun = useCallback(async (id: number) => {
        return await invoke('run:delete', id) as boolean | undefined;
    }, [invoke]);

    return {
        run,
        createRun,
        startCollection,
        fetchRunById,
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
