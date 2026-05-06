import { act, renderHook } from '@testing-library/react';
import type { FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLoginPage } from '../../hooks/useLoginPage';
import { createHttpError } from '../../utils/authUtils';

const mockNavigate = vi.fn();
const mockLoginWithEmail = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/auth', () => ({
    loginWithEmail: (...args: unknown[]) => mockLoginWithEmail(...args),
}));

function formEvent() {
    return { preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>;
}

describe('useLoginPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockLoginWithEmail.mockReset();
    });

    it('validates missing credentials before calling the auth service', async () => {
        const { result } = renderHook(() => useLoginPage());

        await act(async () => {
            await result.current.handleSubmit(formEvent());
        });

        expect(result.current.errorMessage).toBe('Please provide both email and password.');
        expect(mockLoginWithEmail).not.toHaveBeenCalled();
    });

    it('validates email format before login', async () => {
        const { result } = renderHook(() => useLoginPage());

        act(() => {
            result.current.setEmail('not-an-email');
            result.current.setPassword('password');
        });
        await act(async () => {
            await result.current.handleSubmit(formEvent());
        });

        expect(result.current.errorMessage).toBe('Please provide a valid email address.');
        expect(mockLoginWithEmail).not.toHaveBeenCalled();
    });

    it('trims email, logs in, and navigates home on success', async () => {
        mockLoginWithEmail.mockResolvedValueOnce({});
        const { result } = renderHook(() => useLoginPage());

        act(() => {
            result.current.setEmail('  alice@example.com  ');
            result.current.setPassword('SecurePassword1!');
        });
        await act(async () => {
            await result.current.handleSubmit(formEvent());
        });

        expect(mockLoginWithEmail).toHaveBeenCalledWith('alice@example.com', 'SecurePassword1!');
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
        expect(result.current.isLoading).toBe(false);
        expect(result.current.errorMessage).toBe('');
    });

    it('maps login failures into a user-facing message', async () => {
        mockLoginWithEmail.mockRejectedValueOnce(createHttpError(401, 'Invalid credentials.'));
        const { result } = renderHook(() => useLoginPage());

        act(() => {
            result.current.setEmail('alice@example.com');
            result.current.setPassword('wrong-password');
        });
        await act(async () => {
            await result.current.handleSubmit(formEvent());
        });

        expect(result.current.errorMessage).toBe('Invalid email or password.');
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });
});
