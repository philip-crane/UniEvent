import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    enforceHttpsBackend,
    getSecondsUntilRateLimitExpires,
    getSecondsUntilTokenExpires,
    isRateLimited,
    isTokenExpiringSoon,
    sanitizeErrorMessage,
} from '../../utils/securityUtils';

describe('securityUtils', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-06T10:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('escapes HTML in error messages before display', () => {
        const sanitized = sanitizeErrorMessage('<script>alert("x")</script>');

        expect(sanitized).toContain('&lt;script&gt;');
        expect(sanitized).not.toContain('<script>');
    });

    it('uses a safe fallback for empty error messages', () => {
        expect(sanitizeErrorMessage('')).toBe('Something went wrong. Please try again.');
    });

    it('enforces HTTPS backend URLs', () => {
        expect(() => enforceHttpsBackend('https://api.example.com')).not.toThrow();
        expect(() => enforceHttpsBackend('http://api.example.com')).toThrow(/must use HTTPS/);
        expect(() => enforceHttpsBackend('')).toThrow(/not configured/);
    });

    it('detects active rate limits from attempts and last attempt time', () => {
        const now = Date.now();

        expect(isRateLimited(4, now)).toBe(false);
        expect(isRateLimited(5, null)).toBe(false);
        expect(isRateLimited(5, now - 30_000)).toBe(true);
        expect(isRateLimited(5, now - 60_000)).toBe(false);
    });

    it('calculates seconds remaining for rate limits', () => {
        const now = Date.now();

        expect(getSecondsUntilRateLimitExpires(null)).toBe(0);
        expect(getSecondsUntilRateLimitExpires(now - 30_500)).toBe(30);
        expect(getSecondsUntilRateLimitExpires(now - 60_000)).toBe(0);
    });

    it('detects token expiry windows and remaining seconds', () => {
        const nowSeconds = Math.floor(Date.now() / 1000);

        expect(isTokenExpiringSoon(null)).toBe(false);
        expect(isTokenExpiringSoon(nowSeconds + 60)).toBe(true);
        expect(isTokenExpiringSoon(nowSeconds + 300)).toBe(false);
        expect(getSecondsUntilTokenExpires(null)).toBe(0);
        expect(getSecondsUntilTokenExpires(nowSeconds + 42)).toBe(42);
        expect(getSecondsUntilTokenExpires(nowSeconds - 1)).toBe(0);
    });
});
