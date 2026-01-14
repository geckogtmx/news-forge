import { useCallback, useState } from 'react';
import { useIpc } from './useIpc';
import type { RawHeadline, InsertRawHeadline } from '../../electron/main/db/schema';

export function useHeadlines() {
    const { invoke, loading, error } = useIpc();
    const [headlines, setHeadlines] = useState<RawHeadline[]>();

    const createHeadlines = useCallback(async (headlines: Omit<InsertRawHeadline, 'id' | 'createdAt'>[]) => {
        return await invoke('headline:create-bulk', headlines) as RawHeadline[] | undefined;
    }, [invoke]);

    const fetchHeadlinesByRun = useCallback(async (runId: number, filters?: any) => {
        const result = await invoke('headline:get-by-run', runId, filters) as RawHeadline[] | undefined;
        // Explicitly check for undefined - empty array [] should still update state
        if (result !== undefined) {
            setHeadlines(result);
        }
        return result;
    }, [invoke]);

    const getHeadlinesByRun = useCallback(async (runId: number, filters?: any) => {
        return await invoke('headline:get-by-run', runId, filters) as RawHeadline[] | undefined;
    }, [invoke]);

    const getSelectedHeadlines = useCallback(async (runId: number) => {
        return await invoke('headline:get-selected', runId) as RawHeadline[] | undefined;
    }, [invoke]);

    const toggleSelection = useCallback(async (id: number, selected: boolean) => {
        return await invoke('headline:toggle-selection', id, selected) as RawHeadline | undefined;
    }, [invoke]);

    const bulkSelect = useCallback(async (ids: number[], selected: boolean) => {
        return await invoke('headline:bulk-select', ids, selected) as number | undefined;
    }, [invoke]);

    const searchHeadlines = useCallback(async (runId: number, query: string) => {
        return await invoke('headline:search', runId, query) as RawHeadline[] | undefined;
    }, [invoke]);

    const deleteHeadlines = useCallback(async (ids: number[]) => {
        return await invoke('headline:delete-bulk', ids) as number | undefined;
    }, [invoke]);

    return {
        headlines,
        createHeadlines,
        fetchHeadlinesByRun,
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
