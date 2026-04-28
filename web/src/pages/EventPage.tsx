import { Link, useParams } from 'react-router-dom';
import { DEFAULT_EVENT_COVER_IMAGE_URL, formatEventStart, formatTimeRange } from '../utils/eventUtils';
import { downloadIcs, buildGoogleCalendarUrl } from '../utils/calendarUtils';
import { LikeButton } from '../components/LikeButton';
import { HeaderLogoLink } from '../components/HeaderLogoLink';
import { ThemeToggle } from '../components/ThemeToggle';
import { UserMenu } from '../components/UserMenu';
import { ShareButton } from '../components/ShareButton';
import { useEventPage } from '../hooks/useEventPage';
import { CalendarDays, Clock3, MapPin } from 'lucide-react';

export function EventPage() {
  const { id } = useParams<{ id: string }>();
  const {
    currentUser,
    event,
    isLoading,
    isSigningOut,
    showAddMenu,
    setShowAddMenu,
    saveFeedback,
    addMenuRef,
    handleLikeToggle,
    handleSignOut,
    userLabel,
    organizerName,
    coverImageUrl,
  } = useEventPage(id);

  return (
    <div className="page flex flex-col">

      <header className="page-header mx-6 md:mx-8 mt-4 md:mt-6 mb-6 sticky top-4 z-20">
        <div className="header-content">
          <HeaderLogoLink />
          <div className="header-text">
            <h1 className="header-title">Event details</h1>
            <p className="header-subtitle">
              {event ? 'Discover event details.' : 'Loading event details...'}
            </p>
          </div>
        </div>

        <div className="header-toggle relative flex items-center gap-2 rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] px-2 py-1.5 shadow-sm">
          <ThemeToggle />

          {currentUser ? (
            <UserMenu
              userLabel={userLabel}
              onSignOut={handleSignOut}
              isSigningOut={isSigningOut}
            />
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] px-3 py-2 text-[var(--text-primary)] transition-colors duration-200 hover:bg-[var(--button-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-focus-border)]"
              aria-label="Go to login"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto pb-16 px-4">
          {isLoading && (
            <div className="bubble p-6 mb-6">
              <p className="text-sm text-[var(--text-subtle)] animate-pulse">Loading event…</p>
            </div>
          )}

          {!isLoading && !event && (
            <div className="bubble p-6 mb-6">
              <h2 className="text-2xl font-bold text-primary mb-2">Event not found</h2>
              <p className="text-subtle">The event may have been removed or the link is invalid.</p>
            </div>
          )}

          {event && (
            <>
              <section className="mb-6 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-5 shadow-lg md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]">Event</p>
                    <h2 className="mt-2 text-2xl font-bold text-[var(--text-primary)] md:text-3xl">{event.title}</h2>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-[var(--text-subtle)]">
                      <span>{formatEventStart(event.startTime)}</span>
                      <span aria-hidden="true">•</span>
                      <span>Organizer: {organizerName}</span>
                    </div>
                  </div>

                  <div className="event-actions-row flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <button
                        onClick={() => setShowAddMenu((v) => !v)}
                        aria-label="Add event to calendar"
                        aria-haspopup="menu"
                        aria-expanded={showAddMenu}
                        className="event-action-button inline-flex items-center gap-2 rounded-lg bg-[var(--link-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--link-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-focus-border)]"
                      >
                        Add to calendar
                      </button>

                      {showAddMenu && (
                        <div
                          ref={addMenuRef}
                          className="absolute left-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-xl"
                        >
                          <button
                            onClick={() => {
                              window.open(buildGoogleCalendarUrl(event), '_blank', 'noopener,noreferrer');
                              setShowAddMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--input-bg)]"
                          >
                            Google Calendar
                          </button>
                          <button
                            onClick={() => {
                              downloadIcs(event);
                              setShowAddMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-[var(--input-bg)]"
                          >
                            Apple Calendar
                          </button>
                        </div>
                      )}
                    </div>

                    <LikeButton
                      event={event}
                      unlikedLabel="Save"
                      likedLabel="Saved"
                      onToggleChange={handleLikeToggle}
                      className="event-action-button"
                    />
                    <ShareButton event={event} className="event-action-button" />
                  </div>
                </div>

                <p aria-live="polite" className="mt-3 text-xs font-semibold text-[var(--text-subtle)]">
                  {saveFeedback}
                </p>
              </section>

              <section className="mb-6 overflow-hidden rounded-2xl border border-[var(--panel-border)] shadow-lg">
                <div className="relative w-full h-[46vh] min-h-[260px]">
                  <img
                    src={coverImageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = DEFAULT_EVENT_COVER_IMAGE_URL;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="inline-flex items-center rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      Event details
                    </div>
                  </div>
                </div>
              </section>

              <section className="grid gap-4 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-5 shadow-lg md:grid-cols-2">
                <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--input-bg)]/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Time</p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--text-primary)]">
                    <p className="inline-flex items-center gap-2"><CalendarDays size={14} className="text-[var(--text-subtle)]" />{new Intl.DateTimeFormat('da-DK', { weekday: 'long' }).format(new Date(event.startTime))}</p>
                    <p className="inline-flex items-center gap-2"><Clock3 size={14} className="text-[var(--text-subtle)]" />{formatTimeRange(event.startTime, event.endTime)}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--input-bg)]/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Where</p>
                  <div className="mt-3 space-y-2 text-sm text-[var(--text-primary)]">
                    <p className="inline-flex items-center gap-2"><MapPin size={14} className="text-[var(--text-subtle)]" />{event.place?.name || 'Location TBA'}</p>
                  </div>
                </div>
              </section>

              <section className="mt-4 rounded-2xl border border-[var(--panel-border)] bg-[var(--panel-bg)] p-6 shadow-lg">
                <h3 className="mb-3 text-lg font-bold text-[var(--text-primary)]">About this event</h3>
                <div className="text-sm leading-relaxed text-[var(--text-body)]">
                  {event.description ? (
                    <div className="whitespace-pre-wrap break-words overflow-hidden">
                      {event.description}
                    </div>
                  ) : (
                    <p className="italic text-[var(--text-subtle)]">No description available.</p>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
