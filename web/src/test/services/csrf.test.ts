import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getCsrfToken, resetCsrfTokenForTesting, setCsrfToken } from '../../services/csrf';

describe('csrf service', () => {
    beforeEach(() => {
        resetCsrfTokenForTesting();
    });

    afterEach(() => {
        resetCsrfTokenForTesting();
        document.cookie = 'csrf_token=; max-age=0; path=/';
    });

    it('returns empty string when no token is in memory or cookie', () => {
        expect(getCsrfToken()).toBe('');
    });

    it('returns in-memory token set with setCsrfToken', () => {
        setCsrfToken('my-token');

        expect(getCsrfToken()).toBe('my-token');
    });

    it('setCsrfToken with null sets token to empty string, does not fall through to cookie', () => {
        document.cookie = 'csrf_token=cookie-value; path=/';
        setCsrfToken(null);

        // null → '' stored in memory; cookie is NOT consulted because memory slot is now '' (not null)
        expect(getCsrfToken()).toBe('');
    });

    it('reads csrf_token cookie when in-memory slot is null', () => {
        document.cookie = 'csrf_token=from-cookie; path=/';

        expect(getCsrfToken()).toBe('from-cookie');
    });

    it('prefers in-memory token over cookie when both are present', () => {
        document.cookie = 'csrf_token=cookie-val; path=/';
        setCsrfToken('memory-val');

        expect(getCsrfToken()).toBe('memory-val');
    });

    it('resetCsrfTokenForTesting restores cookie fallback', () => {
        setCsrfToken('memory-val');
        document.cookie = 'csrf_token=after-reset; path=/';
        resetCsrfTokenForTesting();

        expect(getCsrfToken()).toBe('after-reset');
    });
});
