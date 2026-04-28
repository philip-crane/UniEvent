import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { signupWithEmail } from '../handlers/signup';
import { mapAuthError, isValidEmail } from '../utils/authUtils';
import type { AccountRole } from '../types';

const DEFAULT_ORGANIZER_CODE_TO_ORG: Record<string, string> = {
    'organizer-test-2026': 'UniEvent Core Team',
    'campus-events-2026': 'DTU Campus Events',
    'student-hub-2026': 'Student Hub Society',
};

const organizerCodesFromEnv = import.meta.env.VITE_ORGANIZER_SIGNUP_PASSWORD?.trim();

export const ORGANIZER_CODE_TO_ORG: Record<string, string> = organizerCodesFromEnv
    ? { [organizerCodesFromEnv]: 'UniEvent Core Team' }
    : DEFAULT_ORGANIZER_CODE_TO_ORG;

export const TEST_ORGANIZER_CODES = Object.entries(DEFAULT_ORGANIZER_CODE_TO_ORG);

export function useSignupPage() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [organizerPasswords, setOrganizerPasswords] = useState<string[]>(['']);
    const [accountRole, setAccountRole] = useState<AccountRole | null>(null);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    function updateOrganizerCode(index: number, value: string) {
        setOrganizerPasswords((current) => current.map((code, i) => (i === index ? value : code)));
    }

    function addOrganizerCodeField() {
        setOrganizerPasswords((current) => [...current, '']);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');

        if (!accountRole) {
            setIsRoleModalOpen(true);
            return;
        }

        const trimmedUsername = username.trim();
        const trimmedEmail = email.trim();

        if (!trimmedUsername || !trimmedEmail || !password || !confirmPassword) {
            setErrorMessage('Please fill in all fields.');
            return;
        }
        if (!isValidEmail(trimmedEmail)) {
            setErrorMessage('Please provide a valid email address.');
            return;
        }
        if (password.length < 6) {
            setErrorMessage('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        let organizerNames: string[] = [];
        if (accountRole === 'organizer') {
            const enteredCodes = organizerPasswords.map((c) => c.trim()).filter(Boolean);
            if (!enteredCodes.length) {
                setErrorMessage('Please enter at least one organizer access password.');
                return;
            }
            const firstInvalidCode = enteredCodes.find((c) => !ORGANIZER_CODE_TO_ORG[c]);
            if (firstInvalidCode) {
                setErrorMessage(`Organizer access password is incorrect: ${firstInvalidCode}`);
                return;
            }
            organizerNames = [...new Set(enteredCodes.map((c) => ORGANIZER_CODE_TO_ORG[c]))];
        }

        try {
            setIsLoading(true);
            await signupWithEmail({ username: trimmedUsername, email: trimmedEmail, password, role: accountRole, organizerNames });
            navigate('/', { replace: true });
        } catch (error) {
            setErrorMessage(mapAuthError(error));
        } finally {
            setIsLoading(false);
        }
    }

    return {
        username, setUsername,
        email, setEmail,
        password, setPassword,
        confirmPassword, setConfirmPassword,
        organizerPasswords,
        accountRole, setAccountRole,
        isRoleModalOpen, setIsRoleModalOpen,
        isLoading,
        errorMessage,
        updateOrganizerCode,
        addOrganizerCodeField,
        handleSubmit,
    };
}
