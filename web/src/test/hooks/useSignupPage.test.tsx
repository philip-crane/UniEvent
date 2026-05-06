import { act, renderHook } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSignupPage } from '../../hooks/useSignupPage';
import { createHttpError } from '../../utils/authUtils';

const mockNavigate = vi.fn();
const mockSignupWithEmail = vi.fn();
const mockVerifyOrganizerKey = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/auth', () => ({
    signupWithEmail: (...args: unknown[]) => mockSignupWithEmail(...args),
}));

vi.mock('../../services/dal', () => ({
    verifyOrganizerKey: (...args: unknown[]) => mockVerifyOrganizerKey(...args),
}));

function formEvent() {
    return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
}

describe('useSignupPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockSignupWithEmail.mockReset();
        mockVerifyOrganizerKey.mockReset();
    });

    it('reopens the role modal when submitting without an account role', async () => {
        const { result } = renderHook(() => useSignupPage());

        act(() => {
            result.current.setIsRoleModalOpen(false);
        });
        await act(async () => {
            await result.current.handleSubmit(formEvent());
        });

        expect(result.current.isRoleModalOpen).toBe(true);
        expect(mockSignupWithEmail).not.toHaveBeenCalled();
    });

    it('validates user signup fields before calling auth', async () => {
        const { result } = renderHook(() => useSignupPage());

        act(() => {
            result.current.setAccountRole('user');
            result.current.setUsername('alice');
            result.current.setEmail('alice@example.com');
            result.current.setPassword('123456789012');
            result.current.setConfirmPassword('different-password');
        });
        await act(async () => {
            await result.current.handleSubmit(formEvent());
        });

        expect(result.current.errorMessage).toBe('Passwords do not match.');
        expect(mockSignupWithEmail).not.toHaveBeenCalled();
    });

    it('trims user details and navigates home after user signup', async () => {
        mockSignupWithEmail.mockResolvedValueOnce({});
        const { result } = renderHook(() => useSignupPage());

        act(() => {
            result.current.setAccountRole('user');
            result.current.setUsername('  alice  ');
            result.current.setEmail('  alice@example.com  ');
            result.current.setPassword('123456789012');
            result.current.setConfirmPassword('123456789012');
        });
        await act(async () => {
            await result.current.handleSubmit(formEvent());
        });

        expect(mockVerifyOrganizerKey).not.toHaveBeenCalled();
        expect(mockSignupWithEmail).toHaveBeenCalledWith({
            username: 'alice',
            email: 'alice@example.com',
            password: '123456789012',
            role: 'user',
            confirmationToken: undefined,
        });
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
        expect(result.current.isLoading).toBe(false);
    });

    it('requires an invitation key for organizer signup', async () => {
        const { result } = renderHook(() => useSignupPage());

        act(() => {
            result.current.setAccountRole('organizer');
            result.current.setUsername('organizer');
            result.current.setEmail('organizer@example.com');
            result.current.setPassword('123456789012');
            result.current.setConfirmPassword('123456789012');
        });
        await act(async () => {
            await result.current.handleSubmit(formEvent());
        });

        expect(result.current.errorMessage).toBe('Please enter your organizer invitation key.');
        expect(mockVerifyOrganizerKey).not.toHaveBeenCalled();
        expect(mockSignupWithEmail).not.toHaveBeenCalled();
    });

    it('uses a verified organizer confirmation token when creating organizer accounts', async () => {
        mockVerifyOrganizerKey.mockResolvedValueOnce({ confirmationToken: 'confirm-token' });
        mockSignupWithEmail.mockResolvedValueOnce({});
        const { result } = renderHook(() => useSignupPage());

        act(() => {
            result.current.setAccountRole('organizer');
            result.current.setUsername('  organizer  ');
            result.current.setEmail('  organizer@example.com  ');
            result.current.setPassword('123456789012');
            result.current.setConfirmPassword('123456789012');
            result.current.setOrganizerKey('  INVITE-KEY  ');
        });
        await act(async () => {
            await result.current.handleSubmit(formEvent());
        });

        expect(mockVerifyOrganizerKey).toHaveBeenCalledWith('INVITE-KEY');
        expect(mockSignupWithEmail).toHaveBeenCalledWith({
            username: 'organizer',
            email: 'organizer@example.com',
            password: '123456789012',
            role: 'organizer',
            confirmationToken: 'confirm-token',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('maps auth errors when signup fails', async () => {
        mockSignupWithEmail.mockRejectedValueOnce(createHttpError(409, 'email exists'));
        const { result } = renderHook(() => useSignupPage());

        act(() => {
            result.current.setAccountRole('user');
            result.current.setUsername('alice');
            result.current.setEmail('alice@example.com');
            result.current.setPassword('123456789012');
            result.current.setConfirmPassword('123456789012');
        });
        await act(async () => {
            await result.current.handleSubmit(formEvent());
        });

        expect(result.current.errorMessage).toBe('email exists');
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
