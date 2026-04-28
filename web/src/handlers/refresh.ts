import { BACKEND_URL, API_AUTH_REFRESH } from '../constants';
import { getCsrfToken, setCsrfToken, buildUserFromResponse, setCurrentUser, clearCurrentUser, storeTokenExpiry, notifyListeners, getCurrentUser } from '../services/auth';
import type { AuthApiResponse } from '../types';

export async function refreshTokens(): Promise<void> {
    const csrf = getCsrfToken();
    const response = await fetch(`${BACKEND_URL}${API_AUTH_REFRESH}`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
        },
    });

    if (!response.ok) {
        setCsrfToken(null);
        clearCurrentUser();
        notifyListeners(null);
        return;
    }

    const data = await response.json() as AuthApiResponse;
    setCsrfToken(data.csrfToken);
    storeTokenExpiry(data.accessTokenExpiresInMs);
    const user = buildUserFromResponse(data, getCurrentUser());
    setCurrentUser(user);
    notifyListeners(user);
}
