import { useEffect } from 'react';
import { IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';

export interface ProgressPayload {
    runId?: number;
    message: string;
    progress: number; // 0 to 100
    total?: number;
    current?: number;
    error?: string;
    metadata?: any;
}

export type ProgressCallback = (payload: ProgressPayload) => void;

/**
 * useProgress - Hook to listen for progress events
 */
export function useProgress() {

    /**
     * Listen for run progress
     */
    const onRunProgress = (callback: ProgressCallback) => {
        useEffect(() => {
            const ipc = (window as any).ipcRenderer;
            if (!ipc) return;

            const remove = ipc.on(IPC_CHANNELS.PROGRESS.RUN_PROGRESS, (_event: any, payload: ProgressPayload) => {
                callback(payload);
            });
            return () => {
                remove();
            };
        }, [callback]);
    };

    /**
     * Listen for compilation progress
     */
    const onCompileProgress = (callback: ProgressCallback) => {
        useEffect(() => {
            const ipc = (window as any).ipcRenderer;
            if (!ipc) return;

            const remove = ipc.on(IPC_CHANNELS.PROGRESS.COMPILE_PROGRESS, (_event: any, payload: ProgressPayload) => {
                callback(payload);
            });
            return () => {
                remove();
            };
        }, [callback]);
    };

    /**
     * Listen for export progress
     */
    const onExportProgress = (callback: ProgressCallback) => {
        useEffect(() => {
            const ipc = (window as any).ipcRenderer;
            if (!ipc) return;

            const remove = ipc.on(IPC_CHANNELS.PROGRESS.EXPORT_PROGRESS, (_event: any, payload: ProgressPayload) => {
                callback(payload);
            });
            return () => {
                remove();
            };
        }, [callback]);
    };

    return {
        onRunProgress,
        onCompileProgress,
        onExportProgress,
    };
}
