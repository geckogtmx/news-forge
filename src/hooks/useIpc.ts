import { useState, useCallback } from 'react';

// Define a generic response type based on our API structure
export interface IpcResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Generic hook for IPC calls
 * Handles loading state, error handling, and type safety for the response
 */
export function useIpc<T = any>() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const invoke = useCallback(async (channel: string, ...args: any[]): Promise<T | undefined> => {
        setLoading(true);
        setError(null);
        try {
            // Access ipcRenderer exposed from preload
            // @ts-ignore
            const result = await window.ipcRenderer.invoke(channel, ...args) as IpcResponse<T>;

            if (!result.success) {
                throw new Error(result.error || 'Unknown IPC error');
            }

            return result.data;
        } catch (err: any) {
            const errorMessage = err.message || 'An unexpected error occurred';
            setError(errorMessage);
            console.error(`IPC Error [${channel}]:`, err);
            return undefined;
        } finally {
            setLoading(false);
        }
    }, []);

    return { invoke, loading, error };
}
