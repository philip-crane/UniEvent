import { Link } from 'react-router-dom';
import { Footer } from '../components/Footer';
import { HeaderLogoLink } from '../components/HeaderLogoLink';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

export function ManualEventPage() {
  const { currentUser } = useAuth();
  const isOrganizer = currentUser?.role === 'organizer';

  return (
    <div className="manual-event-page min-h-screen flex flex-col">
      <header className="page-header mx-6 md:mx-8 mt-4 md:mt-6 mb-8">
        <div className="header-content">
          <HeaderLogoLink />
          <div className="header-text">
            <h1 className="header-title">Create Manual Event</h1>
            <p className="header-subtitle">Organizer-only access</p>
          </div>
        </div>

        <div className="header-toggle">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 px-6 md:px-8 pb-10 max-w-6xl mx-auto w-full">
        <section className="manual-event-shell">
          <div className="manual-event-card">
            <div className="manual-event-card-content">
              <p className="manual-event-eyebrow">STATUS</p>
              <h2 className="manual-event-title">{isOrganizer ? 'Manual event creation is being aligned' : 'Sign in as an organizer to continue'}</h2>
              <p className="manual-event-description">
                {isOrganizer
                  ? 'The current frontend is still being aligned with the new backend/service structure. The route stays in place, but the creation workflow is not wired yet.'
                  : 'This page is reserved for authenticated organizers. Use the login flow first, then return here from your profile.'}
              </p>

              <div className="signup-actions" style={{ marginTop: '24px' }}>
                <Link to="/profile" className="signup-btn signup-btn-primary">
                  Go to Profile
                </Link>
                <Link to="/" className="signup-btn signup-btn-secondary">
                  Back to Events
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
