import { CSRF_COOKIE_NAME } from '../constants';

let csrfToken: string | null = null;

export function getCsrfToken(): string {
  if (csrfToken !== null) {
    return csrfToken;
  }
  return readCookie(CSRF_COOKIE_NAME);
}

export function setCsrfToken(token: string | null): void {
  csrfToken = token ?? '';
}

export function resetCsrfTokenForTesting(): void {
  csrfToken = null;
}

function readCookie(name: string): string {
  if (typeof document === 'undefined' || !document.cookie) {
    return '';
  }

  const prefix = `${name}=`;
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(prefix));

  if (!cookie) {
    return '';
  }

  return decodeURIComponent(cookie.slice(prefix.length));
}
