import { useState, useEffect } from 'react';

export function useAuth() {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<{ name: string; email: string } | null>({
        name: 'Dev User',
        email: 'dev@example.com'
    });

    const logout = () => {
        setUser(null);
    };

    return { loading, user, logout, isAuthenticated: !!user };
}
