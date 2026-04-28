import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
// A context is a REACT-particular thing to share state and just data in general across various REACT components
// accross the entire app without having to pass state "props" (i.e. parameters, properties) down through 
// multiple levels of components (which can get messy and is called "prop drilling"). 
import { isTokenExpiredOrExpiringSoon, onUserChanged } from '../services/auth';
import type { User } from '../types';
import { refreshTokens } from '../handlers/refresh';
import { REFRESH_INTERVAL_MS, REFRESH_THRESHOLD_MS } from '../constants';

type AuthContextValue = {
    currentUser: User | null;
};

const AuthContext = createContext<AuthContextValue>({ currentUser: null });

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    useEffect(() => {
        // Restore session from HttpOnly cookies on page load.
        // If the refresh cookie is valid the server issues fresh tokens and
        // populates in-memory state; if not, the user stays logged out.
        refreshTokens();
        const unsubscribe = onUserChanged(setCurrentUser);
        return unsubscribe;
    }, []);

    useEffect(() => {
        // Proactively refresh the access token before it expires so the user
        // never gets a surprise 401 mid-session.
        async function checkAndRefresh() {
            if (isTokenExpiredOrExpiringSoon(REFRESH_THRESHOLD_MS)) {
                await refreshTokens();
            }
        }

        checkAndRefresh();
        const interval = setInterval(checkAndRefresh, REFRESH_INTERVAL_MS);
        return () => clearInterval(interval);
    }, []);

    return <AuthContext.Provider value={{ currentUser }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    return useContext(AuthContext);
}
