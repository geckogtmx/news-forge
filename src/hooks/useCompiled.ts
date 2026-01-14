import { useCallback, useState } from 'react';
import { useIpc } from './useIpc';
import type { CompiledItem, InsertCompiledItem, RawHeadline } from '../../electron/main/db/schema';

export function useCompiled() {
    const { invoke, loading, error } = useIpc();
    const [compiledItems, setCompiledItems] = useState<CompiledItem[]>([]);

    const createCompiledItem = useCallback(async (data: Omit<InsertCompiledItem, 'id' | 'createdAt' | 'updatedAt'>) => {
        const result = await invoke('compiled:create', data) as CompiledItem | undefined;
        if (result) {
            setCompiledItems(prev => [...prev, result]);
        }
        return result;
    }, [invoke]);

    const fetchCompiledItemsByRun = useCallback(async (runId: number) => {
        const result = await invoke('compiled:get-by-run', runId) as CompiledItem[] | undefined;
        if (result) {
            setCompiledItems(result);
        }
        return result;
    }, [invoke]);

    const getCompiledItemsByRun = useCallback(async (runId: number) => {
        return await invoke('compiled:get-by-run', runId) as CompiledItem[] | undefined;
    }, [invoke]);

    const getSelectedCompiledItems = useCallback(async (runId: number) => {
        return await invoke('compiled:get-selected', runId) as CompiledItem[] | undefined;
    }, [invoke]);

    const updateCompiledItem = useCallback(async (id: number, data: Partial<CompiledItem>) => {
        const result = await invoke('compiled:update', id, data) as CompiledItem | undefined;
        if (result) {
            setCompiledItems(prev => prev.map(item => item.id === id ? result : item));
        }
        return result;
    }, [invoke]);

    const toggleSelection = useCallback(async (id: number, selected: boolean) => {
        const result = await invoke('compiled:toggle-selection', id, selected) as CompiledItem | undefined;
        if (result) {
            setCompiledItems(prev => prev.map(item => item.id === id ? result : item));
        }
        return result;
    }, [invoke]);

    const deleteCompiledItem = useCallback(async (id: number) => {
        const result = await invoke('compiled:delete', id) as boolean | undefined;
        if (result) {
            setCompiledItems(prev => prev.filter(item => item.id !== id));
        }
        return result;
    }, [invoke]);

    const getRelatedHeadlines = useCallback(async (id: number) => {
        return await invoke('compiled:get-related-headlines', id) as RawHeadline[] | undefined;
    }, [invoke]);

    return {
        compiledItems,
        createCompiledItem,
        fetchCompiledItemsByRun,
        getCompiledItemsByRun,
        getSelectedCompiledItems,
        updateCompiledItem,
        toggleSelection,
        deleteCompiledItem,
        getRelatedHeadlines,
        loading,
        error,
    };
}
