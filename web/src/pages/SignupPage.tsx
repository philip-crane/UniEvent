import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { HeaderLogoLink } from '../components/HeaderLogoLink';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { Plus, UserPlus } from 'lucide-react';
import { mapAuthError, signupWithEmail, type AccountRole } from '../services/auth';
import '../styles/SignupPage.css';

const DEFAULT_ORGANIZER_CODE_TO_ORG: Record<string, string> = {
    'organizer-test-2026': 'UniEvent Core Team',
    'campus-events-2026': 'DTU Campus Events',
    'student-hub-2026': 'Student Hub Society',
};

const organizerCodesFromEnv = import.meta.env.VITE_ORGANIZER_SIGNUP_PASSWORD?.trim();

const ORGANIZER_CODE_TO_ORG = organizerCodesFromEnv
    ? { [organizerCodesFromEnv]: 'UniEvent Core Team' }
    : DEFAULT_ORGANIZER_CODE_TO_ORG;

const TEST_ORGANIZER_CODES = Object.entries(DEFAULT_ORGANIZER_CODE_TO_ORG);

export function SignupPage() {
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

    function isValidEmail(value: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }

    function updateOrganizerCode(index: number, value: string) {
        setOrganizerPasswords((current) => current.map((code, codeIndex) => (codeIndex === index ? value : code)));
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
            const enteredCodes = organizerPasswords
                .map((code) => code.trim())
                .filter((code) => !!code);

            if (!enteredCodes.length) {
                setErrorMessage('Please enter at least one organizer access password.');
                return;
            }

            const firstInvalidCode = enteredCodes.find((code) => !ORGANIZER_CODE_TO_ORG[code]);
            if (firstInvalidCode) {
                setErrorMessage(`Organizer access password is incorrect: ${firstInvalidCode}`);
                return;
            }

            organizerNames = [...new Set(enteredCodes.map((code) => ORGANIZER_CODE_TO_ORG[code]))];
        }

        try {
            setIsLoading(true);
            await signupWithEmail({ username: trimmedUsername, email: trimmedEmail, password, role: accountRole, organizerNames });
            navigate('/', { replace: true });
        } catch (error) {
            setErrorMessage(mapAuthError(error, 'signup'));
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="page-header mx-6 md:mx-8 mt-4 md:mt-6 mb-8">
                <div className="header-content">
                    <HeaderLogoLink />
                    <div className="header-text">
                        <h1 className="header-title">Create Your Account</h1>
                        <p className="header-subtitle">Sign up to save your preferences and discover events faster</p>
                    </div>
                </div>

                <div className="header-toggle">
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 px-6 md:px-8 pb-8 max-w-6xl mx-auto w-full">
                <section className="signup-shell">
                    <div className="signup-card">
                        <div className="signup-card-glow" aria-hidden="true" />

                        <div className="signup-card-content">
                            <p className="signup-eyebrow">NEW ACCOUNT</p>
                            <h2 className="signup-title">Sign up to get started</h2>
                            <p className="signup-description">Create your account with a username and password.</p>
                            <p className="signup-helper">Already have an account? Log in from the link below.</p>
                            <p className="signup-role-indicator">
                                Account type: {accountRole === 'organizer' ? 'Organisor' : accountRole === 'user' ? 'User' : 'Not selected'}
                            </p>
                            <p className="signup-role-indicator signup-role-indicator-subtle">
                                Test codes: organizer-test-2026, campus-events-2026, student-hub-2026
                            </p>

                            <form className="signup-form" onSubmit={handleSubmit} noValidate>
                                <label className="signup-label" htmlFor="signup-username">Username</label>
                                <input
                                    id="signup-username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="Choose a username"
                                    className="signup-input"
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                />

                                <label className="signup-label" htmlFor="signup-email">Email</label>
                                <input
                                    id="signup-email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Enter your email"
                                    className="signup-input"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                />

                                <label className="signup-label" htmlFor="signup-password">Password</label>
                                <input
                                    id="signup-password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Create a password"
                                    className="signup-input"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                />

                                <label className="signup-label" htmlFor="signup-confirm-password">Confirm Password</label>
                                <input
                                    id="signup-confirm-password"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    placeholder="Type your password again"
                                    className="signup-input"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
                                />

                                {accountRole === 'organizer' && (
                                    <>
                                        <label className="signup-label" htmlFor="signup-organizer-password-0">Organizer Access Password(s)</label>
                                        {organizerPasswords.map((code, index) => (
                                            <div key={index} className="signup-organizer-row">
                                                <input
                                                    id={`signup-organizer-password-${index}`}
                                                    name={`organizerPassword-${index}`}
                                                    type="password"
                                                    autoComplete="off"
                                                    placeholder="Enter organizer access password"
                                                    className="signup-input"
                                                    value={code}
                                                    onChange={(event) => updateOrganizerCode(index, event.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className="signup-code-add-btn"
                                                    aria-label="Add organizer code field"
                                                    onClick={addOrganizerCodeField}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="signup-helper signup-helper-soft">
                                            {TEST_ORGANIZER_CODES.map(([codeText, organization]) => (
                                                <p key={codeText}>Code: {codeText}{' -> '}{organization}</p>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {errorMessage && <p className="signup-status signup-status-error">{errorMessage}</p>}

                                <div className="signup-actions">
                                    <button type="submit" className="signup-btn signup-btn-primary" disabled={isLoading}>
                                        <UserPlus size={18} />
                                        {isLoading ? 'Signing Up...' : accountRole ? `Sign Up as ${accountRole === 'organizer' ? 'Organisor' : 'User'}` : 'Sign Up'}
                                    </button>


                                </div>
                            </form>

                            <div className="signup-links-row">
                                <Link to="/login" className="signup-link">Already have an account? Log In</Link>
                                <Link to="/" className="signup-link">← Back to Events</Link>
                            </div>
                        </div>
                    </div>
                </section>

                {isRoleModalOpen && (
                    <div
                        className="signup-role-modal-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="signup-role-modal-title"
                        onClick={() => navigate('/login', { replace: true })}
                    >
                        <div className="signup-role-modal" onClick={(event) => event.stopPropagation()}>
                            <h3 id="signup-role-modal-title" className="signup-role-modal-title">Choose account type</h3>
                            <p className="signup-role-modal-text">Do you want to sign up as User or Organisor?</p>

                            <div className="signup-role-modal-actions">
                                <button
                                    type="button"
                                    className="signup-btn signup-btn-primary"
                                    onClick={() => {
                                        setAccountRole('user');
                                        setOrganizerPasswords(['']);
                                        setIsRoleModalOpen(false);
                                    }}
                                >
                                    User
                                </button>

                                <button
                                    type="button"
                                    className="signup-btn signup-btn-facebook"
                                    onClick={() => {
                                        setAccountRole('organizer');
                                        setOrganizerPasswords((current) => (current.length ? current : ['']));
                                        setIsRoleModalOpen(false);
                                    }}
                                >
                                    Organisor
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
