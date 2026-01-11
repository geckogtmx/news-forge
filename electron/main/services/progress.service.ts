import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export interface ProgressPayload {
    runId?: number;
    message: string;
    progress: number; // 0 to 100
    total?: number;
    current?: number;
    error?: string;
    metadata?: any;
}

/**
 * ProgressService - Handles emitting progress events to the renderer
 */
export class ProgressService {
    /**
     * Send run progress update
     */
    sendRunProgress(payload: ProgressPayload) {
        this.broadcast(IPC_CHANNELS.PROGRESS.RUN_PROGRESS, payload);
    }

    /**
     * Send compilation progress update
     */
    sendCompileProgress(payload: ProgressPayload) {
        this.broadcast(IPC_CHANNELS.PROGRESS.COMPILE_PROGRESS, payload);
    }

    /**
     * Send export progress update
     */
    sendExportProgress(payload: ProgressPayload) {
        this.broadcast(IPC_CHANNELS.PROGRESS.EXPORT_PROGRESS, payload);
    }

    /**
     * Check if progress is complete (100%)
     */
    isComplete(progress: number): boolean {
        return progress >= 100;
    }

    /**
     * Broadcast message to all windows
     */
    private broadcast(channel: string, payload: any) {
        try {
            const { BrowserWindow } = require('electron');
            const windows = BrowserWindow.getAllWindows();
            for (const win of windows) {
                if (!win.isDestroyed()) {
                    win.webContents.send(channel, payload);
                }
            }
        } catch (e) {
            // In Node environment (testing), just log it
            if (process.env.NODE_ENV === 'test' || !process.versions.electron) {
                // console.log(`[Mock Broadcast] ${channel}:`, payload);
            }
        }
    }
}

// Export singleton instance
export const progressService = new ProgressService();
