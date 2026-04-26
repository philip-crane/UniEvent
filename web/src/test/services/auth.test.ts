import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Use global fetch mock provided by jsdom.
const mockFetch = vi.fn();

// Provide a full localStorage mock that works across Node/jsdom environments.
const localStorageStore: Record<string, string> = {};
const localStorageMock = {
    getItem: (key: string) => localStorageStore[key] ?? null,
    setItem: (key: string, value: string) => { localStorageStore[key] = value; },
    removeItem: (key: string) => { delete localStorageStore[key]; },
    clear: () => { Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k]); },
};

// Helper: build a successful JSON fetch response.
function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

// Helper: build a failing JSON fetch response.
function errorResponse(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' },
    });
}

import {
    getCurrentUser,
    getAuthToken,
    loginWithEmail,
    mapAuthError,
    onAuthUserChanged,
    signOutCurrentUser,
    signupWithEmail,
} from '../../services/auth';

describe('auth service', () => {
    beforeEach(() => {
        localStorageMock.clear();
        mockFetch.mockReset();
        vi.stubGlobal('fetch', mockFetch);
        vi.stubGlobal('localStorage', localStorageMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    // ── loginWithEmail ──────────────────────────────────────────────────────

    it('logs in and stores token + user in localStorage', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ token: 'tok-1', username: 'alice', email: 'alice@example.com' }));

        const user = await loginWithEmail('alice@example.com', 'secret123');

        expect(user).toMatchObject({ token: 'tok-1', username: 'alice', email: 'alice@example.com' });
        expect(localStorage.getItem('unievent_token')).toBe('tok-1');
        expect(getAuthToken()).toBe('tok-1');
    });

    it('sends credentials to the correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ token: 't', username: 'u', email: 'u@x.com' }));

        await loginWithEmail('u@x.com', 'pass');

        const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('/api/auth/login');
        expect(JSON.parse(init.body as string)).toEqual({ email: 'u@x.com', password: 'pass' });
    });

    it('throws with status when login credentials are wrong', async () => {
        mockFetch.mockResolvedValueOnce(errorResponse({ message: 'Bad credentials' }, 401));

        await expect(loginWithEmail('u@x.com', 'wrong')).rejects.toMatchObject({ status: 401 });
    });

    // ── signupWithEmail ─────────────────────────────────────────────────────

    it('registers and stores token + user in localStorage', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ token: 'tok-2', username: 'bob', email: 'bob@example.com' }));

        const user = await signupWithEmail({ username: 'bob', email: 'bob@example.com', password: 'secret123' });

        expect(user).toMatchObject({ token: 'tok-2', username: 'bob', email: 'bob@example.com' });
        expect(localStorage.getItem('unievent_token')).toBe('tok-2');
    });

    it('sends signup payload to the correct endpoint', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ token: 't', username: 'bob', email: 'bob@x.com' }));

        await signupWithEmail({ username: 'bob', email: 'bob@x.com', password: 'secret123' });

        const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(url).toContain('/api/auth/register');
        expect(JSON.parse(init.body as string)).toEqual({ username: 'bob', email: 'bob@x.com', password: 'secret123' });
    });

    it('throws with status when email is already taken', async () => {
        mockFetch.mockResolvedValueOnce(errorResponse({ message: 'Email is already registered.' }, 409));

        await expect(signupWithEmail({ username: 'bob', email: 'dup@x.com', password: 'secret' })).rejects.toMatchObject({ status: 409 });
    });

    // ── getCurrentUser / getAuthToken ───────────────────────────────────────

    it('returns null when nothing is stored', () => {
        expect(getCurrentUser()).toBeNull();
        expect(getAuthToken()).toBeNull();
    });

    it('returns stored user after login', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ token: 'tok-3', username: 'carol', email: 'carol@x.com' }));
        await loginWithEmail('carol@x.com', 'pw');

        expect(getCurrentUser()).toMatchObject({ token: 'tok-3', username: 'carol', email: 'carol@x.com' });
    });

    // ── onAuthUserChanged ────────────────────────────────────────────────────

    it('fires immediately with current user state', () => {
        localStorage.setItem('unievent_token', 'existing-tok');
        localStorage.setItem('unievent_user', JSON.stringify({ username: 'dave', email: 'dave@x.com' }));

        const callback = vi.fn();
        const unsubscribe = onAuthUserChanged(callback);

        expect(callback).toHaveBeenCalledOnce();
        expect(callback.mock.calls[0][0]).toMatchObject({ username: 'dave', email: 'dave@x.com' });
        unsubscribe();
    });

    it('fires immediately with null when not logged in', () => {
        const callback = vi.fn();
        const unsubscribe = onAuthUserChanged(callback);

        expect(callback).toHaveBeenCalledWith(null);
        unsubscribe();
    });

    it('notifies listeners on login', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ token: 't', username: 'eve', email: 'eve@x.com' }));

        const callback = vi.fn();
        const unsubscribe = onAuthUserChanged(callback);
        callback.mockClear(); // ignore the immediate fire

        await loginWithEmail('eve@x.com', 'pw');

        expect(callback).toHaveBeenCalledWith(expect.objectContaining({ token: 't', username: 'eve', email: 'eve@x.com' }));
        unsubscribe();
    });

    it('returns a working unsubscribe function', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ token: 't', username: 'u', email: 'u@x.com' }));

        const callback = vi.fn();
        const unsubscribe = onAuthUserChanged(callback);
        unsubscribe();
        callback.mockClear();

        await loginWithEmail('u@x.com', 'pw');

        expect(callback).not.toHaveBeenCalled();
    });

    // ── signOutCurrentUser ───────────────────────────────────────────────────

    it('clears localStorage and notifies listeners on sign out', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ token: 'tok', username: 'u', email: 'u@x.com' }));
        await loginWithEmail('u@x.com', 'pw');

        const callback = vi.fn();
        const unsubscribe = onAuthUserChanged(callback);
        callback.mockClear();

        await signOutCurrentUser();

        expect(getAuthToken()).toBeNull();
        expect(getCurrentUser()).toBeNull();
        expect(callback).toHaveBeenCalledWith(null);
        unsubscribe();
    });

    it('returns "Invalid email or password" for 401', () => {
        expect(mapAuthError({ status: 401 }, 'login')).toBe('Invalid email or password.');
    });

    it('returns "Invalid email or password" for 403', () => {
        expect(mapAuthError({ status: 403 })).toBe('Invalid email or password.');
    });

    it('returns the server message for 409 conflicts', () => {
        expect(mapAuthError({ status: 409, message: 'Email is already registered.' })).toBe('Email is already registered.');
    });

    it('returns the server message for 400 bad input', () => {
        expect(mapAuthError({ status: 400, message: 'Validation failed.' })).toBe('Validation failed.');
    });

    it('returns a fallback message for unknown errors', () => {
        expect(mapAuthError(new Error('random failure'))).toBe('Something went wrong. Please try again.');
    });

    it('returns a fallback message for null/undefined', () => {
        expect(mapAuthError(null)).toBe('Something went wrong. Please try again.');
    });
});
