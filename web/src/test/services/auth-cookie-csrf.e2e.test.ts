import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    _resetForTesting,
    getCsrfToken,
    loginWithEmail,
    logout,
    refreshSession,
} from '../../services/auth';
import { apiCall } from '../../services/http';

type CookieAttributes = {
    value: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict';
    maxAge: number;
};

type CookieJar = Record<string, CookieAttributes | undefined>;

type CapturedRequest = {
    url: string;
    method: string;
    credentials: RequestCredentials | undefined;
    csrfHeader: string | null;
    body: unknown;
    cookiesSeenByServer: Record<string, string>;
};

const mockFetch = vi.fn<typeof fetch>();

function jsonResponse(body: unknown, status = 200, setCookie: string[] = []): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...(setCookie.length > 0 ? { 'Set-Cookie': setCookie.join(', ') } : {}),
        },
    });
}

function emptyResponse(status = 204, setCookie: string[] = []): Response {
    return new Response(null, {
        status,
        headers: setCookie.length > 0 ? { 'Set-Cookie': setCookie.join(', ') } : {},
    });
}

function setAuthCookies(cookieJar: CookieJar, access: string, refresh: string, csrf: string): string[] {
    cookieJar.auth_access = cookie(access, true, 86_400);
    cookieJar.auth_refresh = cookie(refresh, true, 604_800);
    cookieJar.csrf_token = cookie(csrf, false, 3_600);

    return [
        serializeCookie('auth_access', cookieJar.auth_access),
        serializeCookie('auth_refresh', cookieJar.auth_refresh),
        serializeCookie('csrf_token', cookieJar.csrf_token),
    ];
}

function clearAuthCookies(cookieJar: CookieJar): string[] {
    cookieJar.auth_access = undefined;
    cookieJar.auth_refresh = undefined;
    cookieJar.csrf_token = undefined;

    return [
        'auth_access=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
        'auth_refresh=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict',
        'csrf_token=; Path=/; Max-Age=0; Secure; SameSite=Strict',
    ];
}

function cookie(value: string, httpOnly: boolean, maxAge: number): CookieAttributes {
    return {
        value,
        httpOnly,
        secure: true,
        sameSite: 'Strict',
        maxAge,
    };
}

function serializeCookie(name: string, attributes: CookieAttributes | undefined): string {
    if (!attributes) {
        throw new Error(`Missing cookie ${name}`);
    }

    return [
        `${name}=${attributes.value}`,
        'Path=/',
        `Max-Age=${attributes.maxAge}`,
        ...(attributes.httpOnly ? ['HttpOnly'] : []),
        attributes.secure ? 'Secure' : '',
        `SameSite=${attributes.sameSite}`,
    ].filter(Boolean).join('; ');
}

function visibleCookies(cookieJar: CookieJar, credentials: RequestCredentials | undefined): Record<string, string> {
    if (credentials !== 'include') {
        return {};
    }

    return Object.fromEntries(
        Object.entries(cookieJar)
            .filter((entry): entry is [string, CookieAttributes] => entry[1] !== undefined)
            .map(([name, attributes]) => [name, attributes.value]),
    );
}

function parseBody(init: RequestInit): unknown {
    if (typeof init.body !== 'string' || init.body === '') {
        return undefined;
    }
    return JSON.parse(init.body);
}

function headersFrom(init: RequestInit): Headers {
    return new Headers(init.headers);
}

function installFakeAuthServer() {
    const cookieJar: CookieJar = {};
    const requests: CapturedRequest[] = [];
    const revokedRefreshTokens = new Set<string>();

    mockFetch.mockImplementation(async (input: RequestInfo | URL, init: RequestInit = {}) => {
        const url = String(input);
        const method = (init.method ?? 'GET').toUpperCase();
        const headers = headersFrom(init);
        const requestCookies = visibleCookies(cookieJar, init.credentials);
        const body = parseBody(init);

        requests.push({
            url,
            method,
            credentials: init.credentials,
            csrfHeader: headers.get('X-CSRF-Token'),
            body,
            cookiesSeenByServer: requestCookies,
        });

        if (url.endsWith('/api/auth/csrf-token') && method === 'GET') {
            return jsonResponse({ csrfToken: 'bootstrap-csrf' });
        }

        if (url.endsWith('/api/auth/login') && method === 'POST') {
            const setCookie = setAuthCookies(cookieJar, 'access-v1', 'refresh-v1', 'csrf-v1');
            return jsonResponse({
                username: 'alice',
                email: 'alice@example.com',
                roles: ['ROLE_ORGANIZER'],
                csrfToken: 'csrf-v1',
                accessTokenExpiresInMs: 3_600_000,
            }, 200, setCookie);
        }

        if (url.endsWith('/api/auth/refresh') && method === 'POST') {
            if (
                requestCookies.auth_refresh !== 'refresh-v1'
                || requestCookies.csrf_token !== 'csrf-v1'
                || headers.get('X-CSRF-Token') !== 'csrf-v1'
                || revokedRefreshTokens.has('refresh-v1')
            ) {
                return jsonResponse({ message: 'Unauthorized' }, 401);
            }

            revokedRefreshTokens.add('refresh-v1');
            const setCookie = setAuthCookies(cookieJar, 'access-v2', 'refresh-v2', 'csrf-v2');
            return jsonResponse({
                username: 'alice',
                email: 'alice@example.com',
                roles: ['ROLE_ORGANIZER'],
                csrfToken: 'csrf-v2',
                accessTokenExpiresInMs: 3_600_000,
            }, 200, setCookie);
        }

        if (url.endsWith('/api/events') && method === 'POST') {
            const authenticated = requestCookies.auth_access === 'access-v2';
            const csrfValid = requestCookies.csrf_token === 'csrf-v2' && headers.get('X-CSRF-Token') === 'csrf-v2';

            if (!authenticated || !csrfValid) {
                return jsonResponse({ message: 'Forbidden' }, 403);
            }

            return jsonResponse({
                id: 'event-1',
                title: 'Uni Night',
                description: 'Cookie auth flow test event',
            }, 201);
        }

        if (url.endsWith('/api/auth/logout') && method === 'POST') {
            if (requestCookies.auth_refresh === 'refresh-v2') {
                revokedRefreshTokens.add('refresh-v2');
            }
            return emptyResponse(204, clearAuthCookies(cookieJar));
        }

        return jsonResponse({ message: `Unexpected request: ${method} ${url}` }, 500);
    });

    return {
        cookieJar,
        requests,
        revokedRefreshTokens,
    };
}

describe('cookie auth + CSRF end-to-end scenario', () => {
    beforeEach(() => {
        _resetForTesting();
        mockFetch.mockReset();
        vi.stubGlobal('fetch', mockFetch);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('logs in, refreshes tokens, creates an event, logs out, and rejects unauthenticated writes', async () => {
        const server = installFakeAuthServer();
        let currentRoute = '/login';

        expect(currentRoute).toBe('/login');
        expect(getCsrfToken()).toBe('');

        const user = await loginWithEmail('alice@example.com', 'secret123');
        currentRoute = '/';

        expect(user).toMatchObject({
            username: 'alice',
            email: 'alice@example.com',
            role: 'organizer',
        });
        expect(currentRoute).toBe('/');
        expect(getCsrfToken()).toBe('csrf-v1');
        expect(server.cookieJar.auth_access).toMatchObject({ value: 'access-v1', httpOnly: true, secure: true, sameSite: 'Strict' });
        expect(server.cookieJar.auth_refresh).toMatchObject({ value: 'refresh-v1', httpOnly: true, secure: true, sameSite: 'Strict' });
        expect(server.cookieJar.csrf_token).toMatchObject({ value: 'csrf-v1', httpOnly: false, secure: true, sameSite: 'Strict' });

        const loginRequest = server.requests[1];
        expect(loginRequest).toMatchObject({
            method: 'POST',
            credentials: 'include',
            cookiesSeenByServer: {},
        });
        expect(loginRequest.url).toContain('/api/auth/login');

        const refreshed = await refreshSession();

        expect(refreshed).toBe(true);
        expect(getCsrfToken()).toBe('csrf-v2');
        expect(server.revokedRefreshTokens.has('refresh-v1')).toBe(true);
        expect(server.cookieJar.auth_access?.value).toBe('access-v2');
        expect(server.cookieJar.auth_refresh?.value).toBe('refresh-v2');
        expect(server.cookieJar.csrf_token?.value).toBe('csrf-v2');

        const refreshRequest = server.requests[2];
        expect(refreshRequest).toMatchObject({
            method: 'POST',
            credentials: 'include',
            csrfHeader: 'csrf-v1',
            cookiesSeenByServer: {
                auth_access: 'access-v1',
                auth_refresh: 'refresh-v1',
                csrf_token: 'csrf-v1',
            },
        });
        expect(refreshRequest.url).toContain('/api/auth/refresh');

        const createEventBody = {
            title: 'Uni Night',
            description: 'Cookie auth flow test event',
            startTime: '2026-05-01T18:00:00.000Z',
            endTime: '2026-05-01T21:00:00.000Z',
            pageId: 'page-1',
        };

        const createResponse = await apiCall('/api/events', {
            method: 'POST',
            body: JSON.stringify(createEventBody),
        });

        expect(createResponse.status).toBe(201);
        await expect(createResponse.json()).resolves.toMatchObject({
            id: 'event-1',
            title: 'Uni Night',
        });

        const createRequest = server.requests[3];
        expect(createRequest).toMatchObject({
            method: 'POST',
            credentials: 'include',
            csrfHeader: 'csrf-v2',
            body: createEventBody,
            cookiesSeenByServer: {
                auth_access: 'access-v2',
                auth_refresh: 'refresh-v2',
                csrf_token: 'csrf-v2',
            },
        });
        expect(createRequest.url).toContain('/api/events');

        await logout();
        currentRoute = '/login';

        expect(currentRoute).toBe('/login');
        expect(getCsrfToken()).toBe('');
        expect(server.revokedRefreshTokens.has('refresh-v2')).toBe(true);
        expect(server.cookieJar.auth_access).toBeUndefined();
        expect(server.cookieJar.auth_refresh).toBeUndefined();
        expect(server.cookieJar.csrf_token).toBeUndefined();

        const logoutRequest = server.requests[4];
        expect(logoutRequest).toMatchObject({
            method: 'POST',
            credentials: 'include',
            csrfHeader: 'csrf-v2',
            cookiesSeenByServer: {
                auth_access: 'access-v2',
                auth_refresh: 'refresh-v2',
                csrf_token: 'csrf-v2',
            },
        });
        expect(logoutRequest.url).toContain('/api/auth/logout');

        const unauthenticatedCreate = await apiCall('/api/events', {
            method: 'POST',
            body: JSON.stringify(createEventBody),
        });

        expect(unauthenticatedCreate.status).toBe(403);
        const unauthenticatedRequest = server.requests[5];
        expect(unauthenticatedRequest).toMatchObject({
            method: 'POST',
            credentials: 'include',
            csrfHeader: null,
            cookiesSeenByServer: {},
        });
    });
});
