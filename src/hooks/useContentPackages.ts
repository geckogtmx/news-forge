import { useCallback, useState } from 'react';
import { useIpc } from './useIpc';
import type { ContentPackage, InsertContentPackage } from '../../electron/main/db/schema';

export function useContentPackages() {
    const { invoke, loading, error } = useIpc();
    const [packages, setPackages] = useState<ContentPackage[]>([]);

    const createPackage = useCallback(async (data: Omit<InsertContentPackage, 'id' | 'createdAt' | 'updatedAt'>) => {
        const result = await invoke('package:create', data) as ContentPackage | undefined;
        if (result) {
            setPackages(prev => [result, ...prev]);
        }
        return result;
    }, [invoke]);

    const createBulkPackages = useCallback(async (data: Omit<InsertContentPackage, 'id' | 'createdAt' | 'updatedAt'>[]) => {
        const result = await invoke('package:create-bulk', data) as ContentPackage[] | undefined;
        if (result) {
            setPackages(prev => [...result, ...prev]);
        }
        return result;
    }, [invoke]);

    const fetchPackagesByRun = useCallback(async (runId: number) => {
        const result = await invoke('package:get-by-run', runId) as ContentPackage[] | undefined;
        if (result) {
            setPackages(result);
        }
        return result;
    }, [invoke]);

    const updatePackage = useCallback(async (id: number, data: Partial<ContentPackage>) => {
        const result = await invoke('package:update', id, data) as ContentPackage | undefined;
        if (result) {
            setPackages(prev => prev.map(p => p.id === id ? result : p));
        }
        return result;
    }, [invoke]);

    const generatePackageContent = useCallback(async (id: number, userId: number, modelId?: string) => {
        const result = await invoke('package:generate', id, userId, modelId) as { pkg: ContentPackage; usage: any } | undefined;
        if (result?.pkg) {
            setPackages(prev => prev.map(p => p.id === id ? result.pkg : p));
        }
        return result;
    }, [invoke]);

    const finalizePackage = useCallback(async (id: number) => {
        const result = await invoke('package:mark-ready', id) as ContentPackage | undefined;
        if (result) {
            setPackages(prev => prev.map(p => p.id === id ? result : p));
        }
        return result;
    }, [invoke]);

    return {
        packages,
        createPackage,
        createBulkPackages,
        fetchPackagesByRun,
        updatePackage,
        generatePackageContent,
        finalizePackage,
        loading,
        error
    };
}
