import { describe, expect, it } from 'vitest';
import {
    isValidEmail,
    isValidEmailLength,
    isValidOrganizerKey,
    isValidPassword,
    isValidUsername,
    passwordsMatch,
} from '../../utils/validationUtils';

describe('validationUtils', () => {
    it('validates organizer keys as exactly 32 alphanumeric characters', () => {
        expect(isValidOrganizerKey('A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6')).toBe(true);
        expect(isValidOrganizerKey('A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5')).toBe(false);
        expect(isValidOrganizerKey('A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p!')).toBe(false);
    });

    it('validates username length and allowed characters', () => {
        expect(isValidUsername('abc')).toBe(true);
        expect(isValidUsername('alice_2026-beta')).toBe(true);
        expect(isValidUsername('ab')).toBe(false);
        expect(isValidUsername('a'.repeat(51))).toBe(false);
        expect(isValidUsername('alice smith')).toBe(false);
    });

    it('validates password length boundaries', () => {
        expect(isValidPassword('a'.repeat(12))).toBe(true);
        expect(isValidPassword('a'.repeat(100))).toBe(true);
        expect(isValidPassword('a'.repeat(11))).toBe(false);
        expect(isValidPassword('a'.repeat(101))).toBe(false);
    });

    it('checks password equality exactly', () => {
        expect(passwordsMatch('SecurePassword1!', 'SecurePassword1!')).toBe(true);
        expect(passwordsMatch('SecurePassword1!', 'securepassword1!')).toBe(false);
    });

    it('validates email structure and practical length', () => {
        expect(isValidEmail('organizer@example.com')).toBe(true);
        expect(isValidEmail('organizer.example.com')).toBe(false);
        expect(isValidEmailLength('a'.repeat(255))).toBe(true);
        expect(isValidEmailLength('a'.repeat(256))).toBe(false);
    });
});
