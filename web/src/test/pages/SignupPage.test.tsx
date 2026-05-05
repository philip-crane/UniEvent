import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SignupPage } from '../../pages/SignupPage';

const mockNavigate = vi.fn();
const mockSignupWithEmail = vi.fn();
const mockMapAuthError = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../../services/auth', () => ({
    signupWithEmail: (...args: unknown[]) => mockSignupWithEmail(...args),
}));

vi.mock('../../utils/authUtils', () => ({
    mapAuthError: (...args: unknown[]) => mockMapAuthError(...args),
    createHttpError: (status: number, message: string) => Object.assign(new Error(message), { status }),
    isValidEmail: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
}));

// Hook imports verifyOrganizerKey even though the user-only form never calls it.
vi.mock('../../services/dal', () => ({
    verifyOrganizerKey: vi.fn(),
}));

function renderPage() {
    return render(
        <MemoryRouter>
            <SignupPage />
        </MemoryRouter>
    );
}

describe('SignupPage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockSignupWithEmail.mockReset();
        mockMapAuthError.mockReset();
    });

    it('shows an error when fields are empty', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: /Sign Up/i }));

        expect(screen.getByText('Please fill in all fields.')).toBeInTheDocument();
        expect(mockSignupWithEmail).not.toHaveBeenCalled();
    });

    it('shows an error when password and confirm password differ', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.type(screen.getByLabelText('Username'), 'alice');
        await user.type(screen.getByLabelText('Email'), 'alice@example.com');
        await user.type(screen.getByLabelText('Password'), '123456789012');
        await user.type(screen.getByLabelText('Confirm Password'), '210987654321');
        await user.click(screen.getByRole('button', { name: /Sign Up/i }));

        expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
        expect(mockSignupWithEmail).not.toHaveBeenCalled();
    });

    it('submits valid signup data and navigates to home', async () => {
        const user = userEvent.setup();
        mockSignupWithEmail.mockResolvedValueOnce({ uid: 'new-user' });
        renderPage();

        await user.type(screen.getByLabelText('Username'), 'alice');
        await user.type(screen.getByLabelText('Email'), 'alice@example.com');
        await user.type(screen.getByLabelText('Password'), '123456789012');
        await user.type(screen.getByLabelText('Confirm Password'), '123456789012');
        await user.click(screen.getByRole('button', { name: /Sign Up/i }));

        expect(mockSignupWithEmail).toHaveBeenCalledWith({
            username: 'alice',
            email: 'alice@example.com',
            password: '123456789012',
            role: 'user',
            confirmationToken: undefined,
        });
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });

    it('shows mapped backend error when signup fails', async () => {
        const user = userEvent.setup();
        const error = new Error('signup-fail');
        mockSignupWithEmail.mockRejectedValueOnce(error);
        mockMapAuthError.mockReturnValueOnce('This email is already in use.');
        renderPage();

        await user.type(screen.getByLabelText('Username'), 'alice');
        await user.type(screen.getByLabelText('Email'), 'alice@example.com');
        await user.type(screen.getByLabelText('Password'), '123456789012');
        await user.type(screen.getByLabelText('Confirm Password'), '123456789012');
        await user.click(screen.getByRole('button', { name: /Sign Up/i }));

        expect(mockMapAuthError).toHaveBeenCalledWith(error);
        expect(screen.getByText('This email is already in use.')).toBeInTheDocument();
    });
});
