import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthUserChanged, type AuthUser } from '../services/auth';

type AuthContextValue = {
    currentUser: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue>({ currentUser: null });

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthUserChanged(setCurrentUser);
        return unsubscribe;
    }, []);

    return <AuthContext.Provider value={{ currentUser }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    return useContext(AuthContext);
}
