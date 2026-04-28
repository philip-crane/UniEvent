import { Link } from 'react-router-dom';
import { HeaderLogoLink } from '../components/HeaderLogoLink';
import { ThemeToggle } from '../components/ThemeToggle';
import { Footer } from '../components/Footer';
import { SavedEventCard } from '../components/SavedEventCard';
import { buildFacebookLoginUrl } from '../services/facebook';
import { useProfilePage } from '../hooks/useProfilePage';
import { CircleUserRound, Heart, LogOut } from 'lucide-react';

export function ProfilePage() {
    const {
        currentUser,
        accountRole,
        organizerNames,
        isSigningOut,
        isLoadingLikedEvents,
        likedEvents,
        userLabel,
        username,
        profileImage,
        handleSignOut,
    } = useProfilePage();

    return (
        <div className="min-h-screen flex flex-col">
            <header className="page-header mx-6 md:mx-8 mt-4 md:mt-6 mb-8">
                <div className="header-content">
                    <HeaderLogoLink />
                    <div className="header-text profile-header-text">
                        <h1 className="header-title">Profile</h1>
                        <p className="header-subtitle">Manage your account and saved events</p>
                    </div>
                </div>

                <div className="header-toggle relative flex items-center gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-2 py-1.5 shadow-sm">
                    <ThemeToggle />
                    <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        aria-label="Log out"
                        title="Log out"
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] p-2 text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--button-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-focus-border)] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <LogOut size={16} />
                    </button>
                </div>
            </header>

            <main className="flex-1 px-6 md:px-8 pb-12 max-w-6xl mx-auto w-full">
                <section aria-label="Profile overview" className="rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 shadow-lg">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:items-start">
                        <div className="lg:col-span-3">
                            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                                <div className="relative flex h-36 w-36 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--dtu-accent-light)] bg-[#0f1020] shadow-[0_0_0_8px_rgba(60,84,240,0.14)]">
                                    {profileImage ? (
                                        <img src={profileImage} alt={userLabel} className="h-full w-full object-cover" />
                                    ) : (
                                        <CircleUserRound aria-label="Default profile picture" className="h-[86%] w-[86%] text-white" strokeWidth={1.55} />
                                    )}
                                </div>

                                <div className="flex-1 space-y-4 text-center sm:text-left">
                                    <div>
                                        <h2 className="text-3xl font-bold text-[var(--text-primary)]">{username}</h2>
                                        <span className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] ${accountRole === 'organizer'
                                            ? 'border border-transparent bg-[var(--link-primary)] text-white'
                                            : 'border border-[var(--panel-border)] bg-[var(--panel-bg)] text-[var(--text-primary)]'
                                            }`}>
                                            {accountRole === 'organizer' ? 'Organizer' : 'User'}
                                        </span>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-base font-semibold text-[var(--text-primary)]">{userLabel}</p>
                                        <p className="text-sm text-[var(--text-subtle)]">{currentUser?.email || 'No email available'}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                                        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--input-bg)] px-3 py-1 text-xs font-semibold text-[var(--text-subtle)]">
                                            <Heart size={12} fill="currentColor" />
                                            {likedEvents.length} saved
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {accountRole === 'organizer' && (
                            <aside className="rounded-xl border border-[var(--panel-border)] bg-[color-mix(in_srgb,var(--panel-bg)_72%,var(--input-bg)_28%)] p-4 shadow-sm">
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">Organizations</p>
                                <div className="mt-3 space-y-2">
                                    {organizerNames.length ? organizerNames.map((organization) => (
                                        <div key={organization} className="inline-flex w-full items-center justify-center rounded-full border border-[var(--panel-border)] bg-[var(--panel-bg)]/85 px-3 py-2 text-xs font-semibold text-[var(--text-primary)]">
                                            {organization}
                                        </div>
                                    )) : (
                                        <p className="py-3 text-xs text-[var(--text-subtle)]">No organizations linked yet.</p>
                                    )}
                                </div>
                            </aside>
                        )}
                    </div>
                </section>

                {accountRole === 'organizer' && (
                    <section className="mt-6 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 shadow-lg">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                                    Facebook Integration
                                </p>
                                <h3 className="mt-1 text-lg font-bold text-[var(--text-primary)]">
                                    Connect your Facebook Page
                                </h3>
                            </div>

                            <a
                                href={buildFacebookLoginUrl()}
                                className="inline-flex items-center justify-center rounded-lg bg-[var(--link-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-[var(--link-primary-hover)]"
                            >
                                Connect Facebook Page
                            </a>
                        </div>

                        <div className="mt-4 rounded-xl border border-[var(--panel-border)] bg-[var(--input-bg)]/65 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-subtle)]">
                                Manual Event
                            </p>
                            <h4 className="mt-1 text-base font-bold text-[var(--text-primary)]">
                                Add event manually
                            </h4>
                            <p className="mt-1 text-sm text-[var(--text-subtle)]">
                                Create and review event details in a dedicated organizer form.
                            </p>
                            <Link
                                to="/organizer/events/new"
                                className="mt-3 inline-flex items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--button-hover)]"
                            >
                                Open Manual Event Form
                            </Link>
                        </div>
                    </section>
                )}

                <section aria-label="Saved events" className="mt-8 w-full rounded-3xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 md:p-8 shadow-xl">
                    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.25em] text-[var(--text-subtle)] uppercase">
                                Saved Events
                            </p>
                            <h3 className="mt-2 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">
                                Your liked events
                            </h3>
                            <p className="mt-2 max-w-2xl text-sm text-[var(--text-subtle)]">
                                Events you like are saved here so you can quickly find them again.
                            </p>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--panel-border)] bg-[var(--panel-bg)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]">
                            <Heart size={16} fill="currentColor" />
                            {likedEvents.length} saved
                        </div>
                    </div>

                    {isLoadingLikedEvents ? (
                        <p className="mt-6 text-sm text-[var(--text-subtle)]">Loading liked events...</p>
                    ) : likedEvents.length === 0 ? (
                        <div className="mt-6 rounded-2xl border border-dashed border-[var(--panel-border)] bg-[var(--input-bg)]/60 p-10 text-center">
                            <Heart size={22} className="mx-auto text-[var(--text-subtle)]" />
                            <p className="mt-3 text-base font-semibold text-[var(--text-primary)]">
                                No liked events yet
                            </p>
                            <p className="mt-2 text-sm text-[var(--text-subtle)]">
                                Tap the heart on an event to save it here.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {likedEvents.map((event) => (
                                <SavedEventCard key={event.id} event={event} />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}
