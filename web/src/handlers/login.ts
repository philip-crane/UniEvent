import { BACKEND_URL, API_AUTH_LOGIN } from '../constants';
import { buildUserFromResponse, setCsrfToken, setCurrentUser, storeTokenExpiry, notifyListeners } from '../services/auth';
import { createHttpError } from '../utils/authUtils';
import type { User, AuthApiResponse } from '../types';

export async function loginWithEmail(email: string, password: string): Promise<User> {
    const response = await fetch(`${BACKEND_URL}${API_AUTH_LOGIN}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as Record<string, unknown>;
        throw createHttpError(
            response.status,
            (body['message'] as string | undefined) ?? response.statusText,
        );
    }

    const data = await response.json() as AuthApiResponse;
    setCsrfToken(data.csrfToken);
    storeTokenExpiry(data.accessTokenExpiresInMs);
    const user = buildUserFromResponse(data);
    setCurrentUser(user);
    notifyListeners(user);
    return user;
}
