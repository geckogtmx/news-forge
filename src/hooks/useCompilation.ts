import { useCallback, useState } from 'react';
import { useIpc } from './useIpc';
import type { HeadlineGroup, CompilationOptions, CompilationResult } from '../../electron/main/services/compilation.service';

export function useCompilation() {
    const { invoke } = useIpc();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Group headlines for a run
     */
    const groupHeadlines = useCallback(
        async (runId: number, options?: { similarityThreshold?: number; maxGroups?: number }) => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await invoke('compilation:group-headlines', runId, options) as HeadlineGroup[];
                return result;
            } catch (err: any) {
                setError(err.message || 'Failed to group headlines');
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [invoke]
    );

    /**
     * Generate a single compilation from a headline group
     */
    const generateCompilation = useCallback(
        async (headlineGroup: HeadlineGroup, runId: number, options: CompilationOptions) => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await invoke(
                    'compilation:generate-compilation',
                    headlineGroup,
                    runId,
                    options
                ) as CompilationResult;
                return result;
            } catch (err: any) {
                setError(err.message || 'Failed to generate compilation');
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [invoke]
    );

    /**
     * Compile all selected headlines for a run
     */
    const compileRun = useCallback(
        async (runId: number, options: CompilationOptions) => {
            setIsLoading(true);
            setError(null);
            try {
                const result = await invoke('compilation:compile-run', runId, options) as CompilationResult[];
                return result;
            } catch (err: any) {
                setError(err.message || 'Failed to compile run');
                throw err;
            } finally {
                setIsLoading(false);
            }
        },
        [invoke]
    );

    return {
        groupHeadlines,
        generateCompilation,
        compileRun,
        isLoading,
        error,
    };
}
