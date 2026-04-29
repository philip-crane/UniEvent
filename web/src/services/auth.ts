import { CSRF_COOKIE_NAME, BACKEND_URL, API_AUTH_PROFILE } from '../constants';
import type { User, AccountRole, AuthApiResponse } from '../types';
import { apiCall } from './fetchClient';

/*let _csrfToken: string | null = null;
let _currentUser: User | null = null;
let _tokenExpiresAt: number | null = null;

const listeners: Array<(user: User | null) => void> = [];*/


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? '';
const USER_KEY = 'unievent_user';

// In-memory CSRF token, populated on login/register/refresh.
let csrfToken = '';

export type AuthUser = {
    username: string;
    email: string;
    uid?: string;
    displayName?: string;
    photoURL?: string | null;
    role?: AccountRole;
    organizerNames?: string[];
};

export type AccountRole = 'user' | 'organizer';

type SignupInput = {
    username: string;
    email: string;
    password: string;
    role?: AccountRole;
    organizerNames?: string[];
};

type AuthErrorContext = 'login' | 'signup' | 'general';

type HttpError = Error & { status: number };

function createHttpError(status: number, message: string): HttpError {
    return Object.assign(new Error(message), { status });
}

// Module-level listener list for auth state subscriptions
const listeners: Array<(user: AuthUser | null) => void> = [];

export function notifyListeners(user: User | null): void {
    listeners.forEach((cb) => cb(user));
}

export function getCsrfToken(): string {
    return csrfToken;
}

export function setCsrfToken(token: string | null): void {
    _csrfToken = token;
}

export function setCurrentUser(user: User): void {
    _currentUser = user;
}

function clearUser(): void {
    localStorage.removeItem(USER_KEY);
}

/*export function clearCurrentUser(): void {
    _currentUser = null;
    _tokenExpiresAt = null;
}*/

export function storeTokenExpiry(accessTokenExpiresInMs: number): void {
    _tokenExpiresAt = Date.now() + accessTokenExpiresInMs;
}

export function getTokenExpiresAt(): number | null {
    return _tokenExpiresAt;
}

export function isTokenExpiredOrExpiringSoon(thresholdMs = 60_000): boolean {
    void thresholdMs;
    return false;
    /*if (_tokenExpiresAt === null) return false;
    return Date.now() >= _tokenExpiresAt - thresholdMs;*/
}

export function getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        const stored = JSON.parse(raw) as {
            username: string;
            email: string;
            uid?: string;
            displayName?: string;
            photoURL?: string | null;
            role?: AccountRole;
            organizerNames?: string[];
        };

        const organizerNames = Array.isArray(stored.organizerNames) ? stored.organizerNames : undefined;

        return {
            username: stored.username,
            email: stored.email,
            uid: stored.uid ?? stored.username,
            displayName: stored.displayName ?? stored.username,
            photoURL: stored.photoURL,
            role: resolveAccountRole(stored.role, organizerNames),
            organizerNames,
        };
    } catch {
        return null;
    }
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
    let response: Response;
    try {
        response = await apiCall(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('CSRF token not available')) {
            throw createHttpError(403, 'CSRF validation failed. Please login again.');
        }
        throw new Error('Connection error, retry');
    }

    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as Record<string, unknown>;
        if (response.status === 401) {
            clearUser();
            csrfToken = '';
            notifyListeners(null);
            if (typeof window !== 'undefined') {
                window.location.assign('/login');
            }
        }
        if (response.status === 403) {
            throw createHttpError(response.status, 'CSRF validation failed. Please login again.');
        }
        throw createHttpError(
            response.status,
            (body['message'] as string | undefined) ?? response.statusText,
        );
    }

    const data = await response.json() as { username: string; email: string; role?: string; roles?: string[]; csrfToken: string };
    csrfToken = data.csrfToken ?? '';
    const user: AuthUser = {
        username: data.username,
        email: data.email,
        uid: data.username,
        displayName: data.username,
        role: resolveAccountRole(data.role ?? data.roles?.[0], undefined),
    };
    persistUser(user);
    notifyListeners(user);
    return user;
}

export async function signupWithEmail({ username, email, password, role, organizerNames }: SignupInput): Promise<AuthUser> {
    let response: Response;
    try {
        response = await apiCall(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password }),
        });
    } catch (error) {
        if (error instanceof Error && error.message.includes('CSRF token not available')) {
            throw createHttpError(403, 'CSRF validation failed. Please login again.');
        }
        throw new Error('Connection error, retry');
    }

    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as Record<string, unknown>;
        if (response.status === 401) {
            clearUser();
            csrfToken = '';
            notifyListeners(null);
            if (typeof window !== 'undefined') {
                window.location.assign('/login');
            }
        }
        if (response.status === 403) {
            throw createHttpError(response.status, 'CSRF validation failed. Please login again.');
        }
        throw createHttpError(
            response.status,
            (body['message'] as string | undefined) ?? response.statusText,
        );
    }

    const data = await response.json() as { username: string; email: string; role?: string; roles?: string[]; csrfToken: string };
    csrfToken = data.csrfToken ?? '';

    /*export function getCurrentUser(): User | null {
    return _currentUser;
}

export function normalizeRole(value: unknown): AccountRole | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = value.trim().toUpperCase();
    if (normalized === 'ORGANIZER' || normalized === 'ROLE_ORGANIZER') return 'organizer';
    if (normalized === 'USER' || normalized === 'ROLE_USER') return 'user';
    return undefined;
}

export function resolveAccountRole(
    roleCandidate: unknown,
    organizerNamesCandidate: unknown,
    fallback: AccountRole = 'user',
): AccountRole {
    const normalizedRole = normalizeRole(roleCandidate);
    if (normalizedRole) return normalizedRole;
    if (Array.isArray(organizerNamesCandidate) && organizerNamesCandidate.length > 0) {
        return 'organizer';
    }
    return fallback;
}

export function buildUserFromResponse(data: AuthApiResponse, existing?: User | null): User {
    return {*/
    const user: AuthUser = {
        username: data.username,
        email: data.email,
        uid: data.username,
        displayName: data.username,
        role: resolveAccountRole(data.role ?? data.roles?.[0], undefined) ?? role,
        organizerNames: organizerNames ? [...organizerNames] : undefined,
        /*uid: existing?.uid ?? data.username,
        displayName: existing?.displayName ?? data.username,
        photoURL: existing?.photoURL,
        role: resolveAccountRole(data.roles?.[0], existing?.organizerNames),
        organizerNames: existing?.organizerNames,*/
    };
}

export function onUserChanged(callback: (user: User | null) => void): () => void {
    listeners.push(callback);
    callback(_currentUser);
    return () => {
        const idx = listeners.indexOf(callback);
        if (idx !== -1) listeners.splice(idx, 1);
    };
}

export async function refreshTokens(): Promise<void> {
    try {
        await refreshSession();
    } catch {
        // ignore refresh errors to keep legacy call sites non-throwing
    }
}

export async function signOutCurrentUser(): Promise<void> {
    await logout();
}

export async function logout(): Promise<void> {
    try {
        await apiCall(`${BACKEND_URL}/api/auth/logout`, {
            method: 'POST',
        });
    } catch {
        // ignore network errors - local state is cleared regardless
    }
    csrfToken = '';
    clearUser();
    notifyListeners(null);
}

export async function refreshSession(): Promise<boolean> {
    try {
        const response = await apiCall(`${BACKEND_URL}/api/auth/refresh`, {
            method: 'POST',
        });

        if (response.ok) {
            const data = await response.json() as { csrfToken: string };
            csrfToken = data.csrfToken ?? '';
            return true;
        }

        if (response.status === 401) {
            csrfToken = '';
            clearUser();
            notifyListeners(null);
            if (typeof window !== 'undefined') {
                window.location.assign('/login');
            }
        }

        if (response.status === 403) {
            throw createHttpError(response.status, 'CSRF validation failed. Please login again.');
        }

        return false;
    } catch (error) {
        if (error instanceof Error && error.message.includes('CSRF token not available')) {
            throw createHttpError(403, 'CSRF validation failed. Please login again.');
        }
        console.error('Session refresh failed:', error);
        throw new Error('Connection error, retry');
    }
}

export function getStoredAccountRole(uid: string): AccountRole {
    const user = getCurrentUser();
    if (!user || (uid && user.uid !== uid)) {
        return 'user';
    }
    return user.role ?? 'user';
}

export function getStoredOrganizerNames(uid: string): string[] {
    const user = getCurrentUser();
    if (!user || (uid && user.uid !== uid)) {
        return [];
    }
    return Array.isArray(user.organizerNames) ? [...user.organizerNames] : [];
}

export async function getAccountProfile(uid?: string): Promise<{ role: AccountRole; organizerNames: string[] }> {
    const user = _currentUser;
    if (!user || (uid && user.uid !== uid)) {
        return { role: 'user', organizerNames: [] };
    }

    const fallbackRole = resolveAccountRole(user.role, user.organizerNames);
    const fallbackOrganizerNames = Array.isArray(user.organizerNames) ? [...user.organizerNames] : [];

    const response = await fetch(`${BACKEND_URL}${API_AUTH_PROFILE}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        return { role: fallbackRole, organizerNames: fallbackOrganizerNames };
    }

    const data = await response.json() as { role?: string; organizerNames?: string[] };
    const profileOrganizerNames = Array.isArray(data.organizerNames) ? data.organizerNames : fallbackOrganizerNames;
    const profile = {
        role: resolveAccountRole(data.role, profileOrganizerNames, fallbackRole),
        organizerNames: profileOrganizerNames,
    };

    const updatedUser: User = {
        ...user,
        role: profile.role,
        organizerNames: [...profile.organizerNames],
    };
    setCurrentUser(updatedUser);
    notifyListeners(updatedUser);

    return profile;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mapAuthError(error: unknown, _context?: AuthErrorContext): string {
    if (error && typeof error === 'object') {
        const e = error as { status?: number; message?: string };
        if (e.status === 401) {
            return 'Invalid email or password.';
        }
        if (e.status === 403 && e.message?.toLowerCase().includes('csrf')) {
            return e.message;
        }
        if (e.status === 409 || (e.status !== undefined && e.message && e.message.toLowerCase().includes('already'))) {
            return e.message ?? 'Account already exists.';
        }
        if (e.status === 400) {
            return e.message ?? 'Invalid input. Please check your details.';
        }
        // Only surface the message when it came from our backend (has a known status code).
        if (e.status !== undefined && e.message) {
            return e.message;
        }
    }
    return 'Something went wrong. Please try again.';
}

/*export function _resetForTesting(): void {
    _currentUser = null;
    _tokenExpiresAt = null;
    _csrfToken = null;
    listeners.length = 0;
}*/
