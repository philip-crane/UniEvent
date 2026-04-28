import { BACKEND_URL, API_AUTH_REGISTER } from '../constants';
import { buildUserFromResponse, setCsrfToken, setCurrentUser, storeTokenExpiry, notifyListeners, resolveAccountRole } from '../services/auth';
import { createHttpError } from '../utils/authUtils';
import type { User, AuthApiResponse, SignupRequest } from '../types';

export async function signupWithEmail({ username, email, password, role, organizerNames }: SignupRequest): Promise<User> {
    const response = await fetch(`${BACKEND_URL}${API_AUTH_REGISTER}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
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
    const user: User = {
        ...buildUserFromResponse(data),
        role: resolveAccountRole(data.roles?.[0], organizerNames) ?? role,
        organizerNames: organizerNames ? [...organizerNames] : undefined,
    };
    setCurrentUser(user);
    notifyListeners(user);
    return user;
}
