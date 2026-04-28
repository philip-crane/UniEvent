import { CSRF_COOKIE_NAME, BACKEND_URL, API_AUTH_PROFILE } from '../constants';
import type { User, AccountRole, AuthApiResponse } from '../types';

let _csrfToken: string | null = null;
let _currentUser: User | null = null;
let _tokenExpiresAt: number | null = null;

const listeners: Array<(user: User | null) => void> = [];

export function notifyListeners(user: User | null): void {
    listeners.forEach((cb) => cb(user));
}

function getCsrfFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.split('; ').find(row => row.startsWith(`${CSRF_COOKIE_NAME}=`));
    return match ? decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1)) : null;
}

export function getCsrfToken(): string | null {
    return _csrfToken ?? getCsrfFromCookie();
}

export function setCsrfToken(token: string | null): void {
    _csrfToken = token;
}

export function setCurrentUser(user: User): void {
    _currentUser = user;
}

export function clearCurrentUser(): void {
    _currentUser = null;
    _tokenExpiresAt = null;
}

export function storeTokenExpiry(accessTokenExpiresInMs: number): void {
    _tokenExpiresAt = Date.now() + accessTokenExpiresInMs;
}

export function getTokenExpiresAt(): number | null {
    return _tokenExpiresAt;
}

export function isTokenExpiredOrExpiringSoon(thresholdMs = 60_000): boolean {
    if (_tokenExpiresAt === null) return false;
    return Date.now() >= _tokenExpiresAt - thresholdMs;
}

export function getCurrentUser(): User | null {
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
    return {
        username: data.username,
        email: data.email,
        uid: existing?.uid ?? data.username,
        displayName: existing?.displayName ?? data.username,
        photoURL: existing?.photoURL,
        role: resolveAccountRole(data.roles?.[0], existing?.organizerNames),
        organizerNames: existing?.organizerNames,
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

export function getStoredAccountRole(uid: string): AccountRole {
    const user = _currentUser;
    if (!user || (uid && user.uid !== uid)) return 'user';
    return user.role ?? 'user';
}

export function getStoredOrganizerNames(uid: string): string[] {
    const user = _currentUser;
    if (!user || (uid && user.uid !== uid)) return [];
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

export function _resetForTesting(): void {
    _currentUser = null;
    _tokenExpiresAt = null;
    _csrfToken = null;
    listeners.length = 0;
}
