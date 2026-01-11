import { useCallback } from 'react';
import { useIpc } from './useIpc';
import { IPC_CHANNELS } from '../../electron/shared/ipc-channels';
// We need to verify if we can import types from schema directly. 
// If this fails during build, we will move types to a shared file.
import type { User, InsertUser } from '../../electron/main/db/schema';

export function useUser() {
    const { invoke, loading, error } = useIpc<User | User[] | boolean>();

    const createUser = useCallback(async (data: Omit<InsertUser, 'id' | 'createdAt' | 'updatedAt' | 'lastSignedIn'>) => {
        return await invoke(IPC_CHANNELS.USER.CREATE, data) as User | undefined;
    }, [invoke]);

    const getUserById = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.USER.GET_BY_ID, id) as User | undefined;
    }, [invoke]);

    const getUserByEmail = useCallback(async (email: string) => {
        return await invoke(IPC_CHANNELS.USER.GET_BY_EMAIL, email) as User | undefined;
    }, [invoke]);

    const updateUser = useCallback(async (id: number, data: Partial<User>) => {
        return await invoke(IPC_CHANNELS.USER.UPDATE, id, data) as User | undefined;
    }, [invoke]);

    const deleteUser = useCallback(async (id: number) => {
        return await invoke(IPC_CHANNELS.USER.DELETE, id) as boolean | undefined;
    }, [invoke]);

    const getAllUsers = useCallback(async () => {
        return await invoke(IPC_CHANNELS.USER.GET_ALL) as User[] | undefined;
    }, [invoke]);

    return {
        createUser,
        getUserById,
        getUserByEmail,
        updateUser,
        deleteUser,
        getAllUsers,
        loading,
        error,
    };
}
