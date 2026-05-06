import { describe, expect, it } from 'vitest';
import { createHttpError, isValidEmail, mapAuthError } from '../../utils/authUtils';

describe('authUtils', () => {
    it('creates an Error object with an HTTP status', () => {
        const error = createHttpError(403, 'Forbidden');

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Forbidden');
        expect(error.status).toBe(403);
    });

    it('validates simple email structure', () => {
        expect(isValidEmail('alice@example.com')).toBe(true);
        expect(isValidEmail('alice@sub.example.dk')).toBe(true);
        expect(isValidEmail('alice.example.com')).toBe(false);
        expect(isValidEmail('alice@')).toBe(false);
        expect(isValidEmail('alice @example.com')).toBe(false);
    });

    it('maps generic unauthorized login failures to a friendly credential message', () => {
        expect(mapAuthError(createHttpError(401, 'Invalid credentials.'))).toBe('Invalid email or password.');
        expect(mapAuthError(createHttpError(403, ''))).toBe('Invalid email or password.');
    });

    it('preserves meaningful authorization and validation messages', () => {
        expect(mapAuthError(createHttpError(401, 'Organizer key expired.'))).toBe('Organizer key expired.');
        expect(mapAuthError(createHttpError(409, 'Email already registered.'))).toBe('Email already registered.');
        expect(mapAuthError(createHttpError(400, 'Username is required.'))).toBe('Username is required.');
        expect(mapAuthError(createHttpError(500, 'Server unavailable.'))).toBe('Server unavailable.');
    });

    it('falls back for unknown errors', () => {
        expect(mapAuthError('boom')).toBe('Something went wrong. Please try again.');
        expect(mapAuthError(null)).toBe('Something went wrong. Please try again.');
    });
});
