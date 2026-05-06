import { act, renderHook } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOrganizerSignupPage } from '../../hooks/useOrganizerSignupPage';
import type { AuthUser } from '../../services/auth';
import { ORGANIZER_SIGNUP_SUCCESS_REDIRECT_MS } from '../../constants';

const mockNavigate = vi.fn();
const mockVerifyOrganizerKey = vi.fn();
const mockSignupWithEmail = vi.fn();
const mockUpgradeToOrganizer = vi.fn();

const authState = vi.hoisted(() => ({
    currentUser: null as AuthUser | null,
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ currentUser: authState.currentUser }),
}));

vi.mock('../../services/dal', () => ({
    verifyOrganizerKey: (...args: unknown[]) => mockVerifyOrganizerKey(...args),
}));

vi.mock('../../services/auth', () => ({
    signupWithEmail: (...args: unknown[]) => mockSignupWithEmail(...args),
    upgradeToOrganizer: (...args: unknown[]) => mockUpgradeToOrganizer(...args),
}));

type OrganizerSignupHookResult = ReturnType<typeof renderHook<ReturnType<typeof useOrganizerSignupPage>, unknown>>['result'];

function formEvent() {
    return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
}

async function verifyKey(result: OrganizerSignupHookResult) {
    mockVerifyOrganizerKey.mockResolvedValueOnce({
        confirmationToken: 'confirm-token',
        email: 'organizer@example.com',
    });

    act(() => {
        result.current.setKeyInput('  INVITE-KEY  ');
    });
    await act(async () => {
        await result.current.handleVerifyKey(formEvent());
    });
}

describe('useOrganizerSignupPage', () => {
    beforeEach(() => {
        authState.currentUser = null;
        mockNavigate.mockReset();
        mockVerifyOrganizerKey.mockReset();
        mockSignupWithEmail.mockReset();
        mockUpgradeToOrganizer.mockReset();
        vi.useRealTimers();
    });

    it('requires an invitation key before verification', async () => {
        const { result } = renderHook(() => useOrganizerSignupPage());

        await act(async () => {
            await result.current.handleVerifyKey(formEvent());
        });

        expect(result.current.errorMessage).toBe('Key is required.');
        expect(mockVerifyOrganizerKey).not.toHaveBeenCalled();
    });

    it('trims and verifies the invitation key before advancing to registration', async () => {
        const { result } = renderHook(() => useOrganizerSignupPage());

        await verifyKey(result);

        expect(mockVerifyOrganizerKey).toHaveBeenCalledWith('INVITE-KEY');
        expect(result.current.currentStep).toBe(2);
        expect(result.current.email).toBe('organizer@example.com');
        expect(result.current.errorMessage).toBe('');
    });

    it('stays on step one when the invitation key is invalid', async () => {
        mockVerifyOrganizerKey.mockResolvedValueOnce(null);
        const { result } = renderHook(() => useOrganizerSignupPage());

        act(() => {
            result.current.setKeyInput('BAD-KEY');
        });
        await act(async () => {
            await result.current.handleVerifyKey(formEvent());
        });

        expect(result.current.currentStep).toBe(1);
        expect(result.current.errorMessage).toBe('Organizer access key is invalid.');
    });

    it('validates registration details before creating an organizer account', async () => {
        const { result } = renderHook(() => useOrganizerSignupPage());
        await verifyKey(result);

        act(() => {
            result.current.setUsername('organizer');
            result.current.setPassword('123456789012');
            result.current.setConfirmPassword('different-password');
        });
        await act(async () => {
            await result.current.handleRegister(formEvent());
        });

        expect(result.current.errorMessage).toBe('Passwords do not match.');
        expect(mockSignupWithEmail).not.toHaveBeenCalled();
    });

    it('registers a new organizer account and redirects to login after success', async () => {
        vi.useFakeTimers();
        mockSignupWithEmail.mockResolvedValueOnce({});
        const { result } = renderHook(() => useOrganizerSignupPage());
        await verifyKey(result);

        act(() => {
            result.current.setUsername('  organizer  ');
            result.current.setPassword('123456789012');
            result.current.setConfirmPassword('123456789012');
        });
        await act(async () => {
            await result.current.handleRegister(formEvent());
        });

        expect(mockSignupWithEmail).toHaveBeenCalledWith({
            username: 'organizer',
            email: 'organizer@example.com',
            password: '123456789012',
            role: 'organizer',
            confirmationToken: 'confirm-token',
        });
        expect(result.current.showSuccessMessage).toBe(true);

        act(() => {
            vi.advanceTimersByTime(ORGANIZER_SIGNUP_SUCCESS_REDIRECT_MS);
        });
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('upgrades an existing user to organizer and redirects to profile', async () => {
        vi.useFakeTimers();
        authState.currentUser = {
            uid: 'user-1',
            username: 'alice',
            email: 'alice@example.com',
            role: 'user',
        };
        mockUpgradeToOrganizer.mockResolvedValueOnce({});
        const { result } = renderHook(() => useOrganizerSignupPage());
        await verifyKey(result);

        await act(async () => {
            await result.current.handleUpgrade(formEvent());
        });

        expect(mockUpgradeToOrganizer).toHaveBeenCalledWith('confirm-token');
        expect(result.current.showSuccessMessage).toBe(true);

        act(() => {
            vi.advanceTimersByTime(ORGANIZER_SIGNUP_SUCCESS_REDIRECT_MS);
        });
        expect(mockNavigate).toHaveBeenCalledWith('/profile', { replace: true });
    });
});
