import { Link } from 'react-router-dom';
import { ExternalLink, KeyRound } from 'lucide-react';
import { Footer } from '../components/Footer';
import { HeaderLogoLink } from '../components/HeaderLogoLink';
import { ThemeToggle } from '../components/ThemeToggle';
import { ORGANIZER_REQUEST_FORM_URL } from '../constants';

export function OrganizerSignupLandingPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="page-header mx-6 md:mx-8 mt-4 md:mt-6 mb-8">
                <div className="header-content">
                    <HeaderLogoLink />
                    <div className="header-text">
                        <h1 className="header-title">Organizer Signup</h1>
                        <p className="header-subtitle">Choose your path to get started</p>
                    </div>
                </div>

                <div className="header-toggle">
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 px-6 md:px-8 pb-8 max-w-6xl mx-auto w-full">
                <section className="signup-shell">
                    <div className="signup-card organizer-flow-card">
                        <div className="signup-card-glow" aria-hidden="true" />

                        <div className="signup-card-content">
                            <p className="signup-eyebrow">ORGANIZER ACCESS</p>
                            <h2 className="signup-title">How would you like to continue?</h2>
                            <p className="signup-description">
                                If you need to request a key, use our Google Form so the review process stays outside the app.
                                If you already received a key code by email, you can continue directly to registration.
                            </p>

                            <div className="organizer-flow-options">
                                <article className="organizer-flow-option">
                                    <div className="organizer-flow-option-icon" aria-hidden="true">
                                        <ExternalLink size={18} />
                                    </div>
                                    <h3>Request New Key</h3>
                                    <p>
                                        Open the Google Form to submit your request. We review it within 24 hours if you are eligible.
                                    </p>
                                    <a
                                        href={ORGANIZER_REQUEST_FORM_URL}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="signup-btn signup-btn-primary organizer-flow-btn"
                                    >
                                        Request New Key
                                    </a>
                                </article>

                                <article className="organizer-flow-option">
                                    <div className="organizer-flow-option-icon" aria-hidden="true">
                                        <KeyRound size={18} />
                                    </div>
                                    <h3>Already Have a Key Code</h3>
                                    <p>
                                        Enter your existing 32-character key and complete organizer account registration now.
                                    </p>
                                    <Link to="/signup-organizer" className="signup-btn signup-btn-primary organizer-flow-btn">
                                        Already Have a Key Code
                                    </Link>
                                </article>
                            </div>

                            <div className="signup-links-row">
                                <Link to="/organizer/onboarding" className="signup-link">Back to Organizer Overview</Link>
                                <Link to="/" className="signup-link">Back to Events</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
