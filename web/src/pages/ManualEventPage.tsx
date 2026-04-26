import { Link } from 'react-router-dom';
import { CalendarDays, FilePlus2, Image as ImageIcon, Link as LinkIcon, MapPin, Save, Tags, Ticket } from 'lucide-react';
import { Footer } from '../components/Footer';
import { HeaderLogoLink } from '../components/HeaderLogoLink';
import { ThemeToggle } from '../components/ThemeToggle';
import '../styles/ManualEventPage.css';

export function ManualEventPage() {
    return (
        <div className="manual-event-page min-h-screen flex flex-col">
            <header className="page-header mx-6 md:mx-8 mt-4 md:mt-6 mb-8">
                <div className="header-content">
                    <HeaderLogoLink />
                    <div className="header-text">
                        <h1 className="header-title">Create Manual Event</h1>
                        <p className="header-subtitle">Organizer draft form for adding an event manually</p>
                    </div>
                </div>

                <div className="header-toggle">
                    <ThemeToggle />
                </div>
            </header>

            <main className="flex-1 px-6 md:px-8 pb-10 max-w-6xl mx-auto w-full">
                <section className="manual-event-shell">
                    <div className="manual-event-card">
                        <div className="manual-event-card-glow" aria-hidden="true" />

                        <div className="manual-event-card-content">
                            <div className="manual-event-heading-row">
                                <div>
                                    <p className="manual-event-eyebrow">ORGANIZER TOOLS</p>
                                    <h2 className="manual-event-title">Manual Event Builder</h2>
                                    <p className="manual-event-description">
                                        This is UI-only for now. Save and publish actions are intentionally disabled until backend logic is wired.
                                    </p>
                                </div>
                                <div className="manual-event-badge" aria-label="UI only mode">
                                    <FilePlus2 size={16} />
                                    Draft UI
                                </div>
                            </div>

                            <form className="manual-event-form" onSubmit={(event) => event.preventDefault()}>
                                <section className="manual-event-section" aria-label="Basic details">
                                    <h3 className="manual-event-section-title">Basic Details</h3>
                                    <div className="manual-event-grid">
                                        <label className="manual-event-field">
                                            <span>Event title</span>
                                            <input type="text" placeholder="DTU Robotics Night 2026" className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>Organizer display name</span>
                                            <input type="text" placeholder="DTU Robotics Society" className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>Category</span>
                                            <select className="manual-event-input">
                                                <option>Workshop</option>
                                                <option>Conference</option>
                                                <option>Hackathon</option>
                                                <option>Career</option>
                                                <option>Social</option>
                                            </select>
                                        </label>

                                        <label className="manual-event-field">
                                            <span>Audience</span>
                                            <select className="manual-event-input">
                                                <option>Open to everyone</option>
                                                <option>Students only</option>
                                                <option>Staff only</option>
                                                <option>Invite only</option>
                                            </select>
                                        </label>
                                    </div>
                                </section>

                                <section className="manual-event-section" aria-label="Date and location">
                                    <h3 className="manual-event-section-title">
                                        <CalendarDays size={16} />
                                        Date and Location
                                    </h3>
                                    <div className="manual-event-grid">
                                        <label className="manual-event-field">
                                            <span>Start date</span>
                                            <input type="date" className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>Start time</span>
                                            <input type="time" className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>End date</span>
                                            <input type="date" className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>End time</span>
                                            <input type="time" className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field manual-event-field-wide">
                                            <span>
                                                <MapPin size={14} />
                                                Venue name
                                            </span>
                                            <input type="text" placeholder="Oticon Hall, Building 302" className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field manual-event-field-wide">
                                            <span>Address</span>
                                            <input type="text" placeholder="Anker Engelunds Vej 1, 2800 Kongens Lyngby" className="manual-event-input" />
                                        </label>
                                    </div>
                                </section>

                                <section className="manual-event-section" aria-label="Media and registration">
                                    <h3 className="manual-event-section-title">
                                        <ImageIcon size={16} />
                                        Media and Registration
                                    </h3>
                                    <div className="manual-event-grid">
                                        <label className="manual-event-field manual-event-field-wide">
                                            <span>Cover image URL</span>
                                            <input type="url" placeholder="https://..." className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field manual-event-field-wide">
                                            <span>
                                                <LinkIcon size={14} />
                                                External event link
                                            </span>
                                            <input type="url" placeholder="https://facebook.com/events/..." className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>
                                                <Ticket size={14} />
                                                Ticket type
                                            </span>
                                            <select className="manual-event-input">
                                                <option>Free</option>
                                                <option>Paid</option>
                                                <option>RSVP only</option>
                                            </select>
                                        </label>

                                        <label className="manual-event-field">
                                            <span>Capacity</span>
                                            <input type="number" placeholder="120" className="manual-event-input" min={0} />
                                        </label>
                                    </div>
                                </section>

                                <section className="manual-event-section" aria-label="Description and tags">
                                    <h3 className="manual-event-section-title">
                                        <Tags size={16} />
                                        Content
                                    </h3>
                                    <div className="manual-event-grid">
                                        <label className="manual-event-field manual-event-field-wide">
                                            <span>Short summary</span>
                                            <input type="text" placeholder="A fast introduction to autonomous drone systems." className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field manual-event-field-wide">
                                            <span>Tags</span>
                                            <input type="text" placeholder="robotics, ai, drones, engineering" className="manual-event-input" />
                                        </label>

                                        <label className="manual-event-field manual-event-field-full">
                                            <span>Full description</span>
                                            <textarea
                                                className="manual-event-input manual-event-textarea"
                                                rows={7}
                                                placeholder="Describe agenda, speakers, expectations, and practical details..."
                                            />
                                        </label>
                                    </div>
                                </section>

                                <div className="manual-event-actions">
                                    <Link to="/profile" className="manual-event-btn manual-event-btn-ghost">
                                        Back to Profile
                                    </Link>

                                    <button type="button" className="manual-event-btn manual-event-btn-secondary" disabled>
                                        <Save size={16} />
                                        Save Draft (Soon)
                                    </button>

                                    <button type="submit" className="manual-event-btn manual-event-btn-primary" disabled>
                                        Publish Event (Soon)
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
