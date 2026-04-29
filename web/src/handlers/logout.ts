import { BACKEND_URL, API_AUTH_LOGOUT } from '../constants';
import { getCsrfToken, setCsrfToken, clearCurrentUser, notifyListeners } from '../services/auth';

export async function signOutCurrentUser(): Promise<void> {
    const csrf = getCsrfToken();
    try {
        await fetch(`${BACKEND_URL}${API_AUTH_LOGOUT}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...(csrf ? { 'X-CSRF-Token': csrf } : {}),
            },
        });
    } catch {
    }
    setCsrfToken(null);
    clearCurrentUser();
    notifyListeners(null);
}
