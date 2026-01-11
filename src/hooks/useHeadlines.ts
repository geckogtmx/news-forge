import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';
import type { RawHeadline, InsertRawHeadline } from '../../electron/main/db/schema';

export function useHeadlines() {
    const { invoke, loading, error } = useIpc<RawHeadline | RawHeadline[] | number>();

    const createHeadlines = useCallback(async (headlines: Omit<InsertRawHeadline, 'id' | 'createdAt'>[]) => {
        return await invoke(IPC_CHANNELS.HEADLINE.CREATE_BULK, headlines) as RawHeadline[] | undefined;
    }, [invoke]);

    const getHeadlinesByRun = useCallback(async (runId: number, filters?: any) => {
        return await invoke(IPC_CHANNELS.HEADLINE.GET_BY_RUN, runId, filters) as RawHeadline[] | undefined;
    }, [invoke]);

    const getSelectedHeadlines = useCallback(async (runId: number) => {
        return await invoke(IPC_CHANNELS.HEADLINE.GET_SELECTED, runId) as RawHeadline[] | undefined;
    }, [invoke]);

    const toggleSelection = useCallback(async (id: number, selected: boolean) => {
        return await invoke(IPC_CHANNELS.HEADLINE.TOGGLE_SELECTION, id, selected) as RawHeadline | undefined;
    }, [invoke]);

    const bulkSelect = useCallback(async (ids: number[], selected: boolean) => {
        return await invoke(IPC_CHANNELS.HEADLINE.BULK_SELECT, ids, selected) as number | undefined;
    }, [invoke]);

    const searchHeadlines = useCallback(async (runId: number, query: string) => {
        return await invoke(IPC_CHANNELS.HEADLINE.SEARCH, runId, query) as RawHeadline[] | undefined;
    }, [invoke]);

    const deleteHeadlines = useCallback(async (ids: number[]) => {
        return await invoke(IPC_CHANNELS.HEADLINE.DELETE, ids) as number | undefined;
    }, [invoke]);

    return {
        createHeadlines,
        getHeadlinesByRun,
        getSelectedHeadlines,
        toggleSelection,
        bulkSelect,
        searchHeadlines,
        deleteHeadlines,
        loading,
        error,
    };
}
