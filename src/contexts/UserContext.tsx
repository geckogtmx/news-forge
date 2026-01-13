import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useUser } from '../hooks/useUser';
import type { User } from '../../electron/main/db/schema';

interface UserContextType {
    currentUser: User | null;
    isLoading: boolean;
    setCurrentUser: (user: User | null) => void;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const { getAllUsers, getUserById } = useUser();
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = async () => {
        // Simple logic for single-user desktop app:
        // Try to get the last active user, or the first user, or null
        setIsLoading(true);
        try {
            const users = await getAllUsers();
            if (users && users.length > 0) {
                // For now, just pick the first one. 
                // Later we can implement "Last Signed In" logic stored in localStorage or store.
                setCurrentUser(users[0]);
            } else {
                // No users exist
                setCurrentUser(null);
            }
        } catch (error) {
            console.error("Failed to load user", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        refreshUser();
    }, []);

    return (
        <UserContext.Provider value={{ currentUser, isLoading, setCurrentUser, refreshUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUserContext() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUserContext must be used within a UserProvider');
    }
    return context;
}
