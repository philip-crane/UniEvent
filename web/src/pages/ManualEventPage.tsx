import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, FilePlus2, Image as ImageIcon, MapPin, Save, Tags, Ticket } from 'lucide-react';
import { Footer } from '../components/Footer';
import { HeaderLogoLink } from '../components/HeaderLogoLink';
import { ThemeToggle } from '../components/ThemeToggle';
import { createEvent, createPage, uploadEventCover } from '../services/dal';
import type { CreateEventRequest, CreatePageRequest, Place } from '../types';
import '../styles/ManualEventPage.css';

type FormState = {
    title: string;
    organizerName: string;
    category: string;
    audience: string;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    venueName: string;
    address: string;
    coverImageFile: File | null;
    ticketType: string;
    capacity: string;
    summary: string;
    tags: string;
    description: string;
};

const INITIAL_FORM_STATE: FormState = {
    title: '',
    organizerName: '',
    category: 'Workshop',
    audience: 'Open to everyone',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    venueName: '',
    address: '',
    coverImageFile: null,
    ticketType: 'Free',
    capacity: '',
    summary: '',
    tags: '',
    description: '',
};

function toIsoDateTime(date: string, time: string): string {
    return new Date(`${date}T${time}`).toISOString();
}

function toSlug(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 64);
}

export function ManualEventPage() {
    const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
    const [isPublishing, setIsPublishing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleFieldChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = (): string | null => {
        if (!form.title.trim()) {
            return 'Event title is required.';
        }
        if (!form.organizerName.trim()) {
            return 'Organizer display name is required.';
        }
        if (!form.startDate || !form.startTime) {
            return 'Start date and start time are required.';
        }
        if ((form.endDate && !form.endTime) || (!form.endDate && form.endTime)) {
            return 'Provide both end date and end time, or leave both empty.';
        }

        const startTimestamp = Date.parse(`${form.startDate}T${form.startTime}`);
        if (Number.isNaN(startTimestamp)) {
            return 'Start date/time is invalid.';
        }

        if (form.endDate && form.endTime) {
            const endTimestamp = Date.parse(`${form.endDate}T${form.endTime}`);
            if (Number.isNaN(endTimestamp)) {
                return 'End date/time is invalid.';
            }
            if (endTimestamp <= startTimestamp) {
                return 'End time must be after start time.';
            }
        }

        return null;
    };

    const handlePublish = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSuccessMessage(null);

        const validationError = validateForm();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }

        setErrorMessage(null);
        setIsPublishing(true);

        const place: Place | undefined = form.venueName.trim() || form.address.trim()
            ? {
                name: form.venueName.trim() || undefined,
                location: form.address.trim() ? { street: form.address.trim() } : undefined,
            }
            : undefined;

        const enrichedDescriptionParts = [
            form.summary.trim(),
            form.description.trim(),
            form.tags.trim() ? `Tags: ${form.tags.trim()}` : '',
            form.category.trim() ? `Category: ${form.category.trim()}` : '',
            form.audience.trim() ? `Audience: ${form.audience.trim()}` : '',
            form.ticketType.trim() ? `Ticket: ${form.ticketType.trim()}` : '',
            form.capacity.trim() ? `Capacity: ${form.capacity.trim()}` : '',
        ].filter(Boolean);

        const organizerName = form.organizerName.trim();
        const organizerSlug = toSlug(organizerName);

        const pagePayload: CreatePageRequest = {
            id: organizerSlug,
            name: organizerName,
            url: `https://facebook.com/${organizerSlug}`,
            active: true,
        };

        try {
            const createdPage = await createPage(pagePayload);

            const eventPayload: CreateEventRequest = {
                pageId: createdPage.id,
                title: form.title.trim(),
                description: enrichedDescriptionParts.length > 0 ? enrichedDescriptionParts.join('\n\n') : undefined,
                startTime: toIsoDateTime(form.startDate, form.startTime),
                endTime: form.endDate && form.endTime ? toIsoDateTime(form.endDate, form.endTime) : undefined,
                place,
            };

            const createdEvent = await createEvent(eventPayload);

            if (form.coverImageFile) {
                try {
                    await uploadEventCover(createdEvent.id, form.coverImageFile);
                } catch (e) {
                    console.warn('Cover image upload failed', e);
                    // do not fail entire publish for image upload
                }
            }

            setSuccessMessage(`Published "${createdEvent.title}" successfully.`);
            setForm(INITIAL_FORM_STATE);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to publish event.';
            setErrorMessage(message);
        } finally {
            setIsPublishing(false);
        }
    };

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
                                        Publish an event manually by creating the organizer page and event record in one flow.
                                    </p>
                                </div>
                                <div className="manual-event-badge" aria-label="publish mode">
                                    <FilePlus2 size={16} />
                                    Publish Mode
                                </div>
                            </div>

                            <form className="manual-event-form" onSubmit={handlePublish}>
                                {errorMessage && (
                                    <div className="manual-event-feedback manual-event-feedback-error" role="alert">
                                        {errorMessage}
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="manual-event-feedback manual-event-feedback-success" role="status" aria-live="polite">
                                        {successMessage}
                                    </div>
                                )}

                                <section className="manual-event-section" aria-label="Basic details">
                                    <h3 className="manual-event-section-title">Basic Details</h3>
                                    <div className="manual-event-grid">
                                        <label className="manual-event-field">
                                            <span>Event title</span>
                                            <input
                                                type="text"
                                                placeholder="DTU Robotics Night 2026"
                                                className="manual-event-input"
                                                value={form.title}
                                                onChange={(event) => handleFieldChange('title', event.target.value)}
                                            />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>Organizer display name</span>
                                            <input
                                                type="text"
                                                placeholder="DTU Robotics Society"
                                                className="manual-event-input"
                                                value={form.organizerName}
                                                onChange={(event) => handleFieldChange('organizerName', event.target.value)}
                                            />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>Category</span>
                                            <select
                                                className="manual-event-input"
                                                value={form.category}
                                                onChange={(event) => handleFieldChange('category', event.target.value)}
                                            >
                                                <option>Workshop</option>
                                                <option>Conference</option>
                                                <option>Hackathon</option>
                                                <option>Career</option>
                                                <option>Social</option>
                                            </select>
                                        </label>

                                        <label className="manual-event-field">
                                            <span>Audience</span>
                                            <select
                                                className="manual-event-input"
                                                value={form.audience}
                                                onChange={(event) => handleFieldChange('audience', event.target.value)}
                                            >
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
                                            <input
                                                type="date"
                                                className="manual-event-input"
                                                value={form.startDate}
                                                onChange={(event) => handleFieldChange('startDate', event.target.value)}
                                            />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>Start time</span>
                                            <input
                                                type="time"
                                                className="manual-event-input"
                                                value={form.startTime}
                                                onChange={(event) => handleFieldChange('startTime', event.target.value)}
                                            />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>End date</span>
                                            <input
                                                type="date"
                                                className="manual-event-input"
                                                value={form.endDate}
                                                onChange={(event) => handleFieldChange('endDate', event.target.value)}
                                            />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>End time</span>
                                            <input
                                                type="time"
                                                className="manual-event-input"
                                                value={form.endTime}
                                                onChange={(event) => handleFieldChange('endTime', event.target.value)}
                                            />
                                        </label>

                                        <label className="manual-event-field manual-event-field-wide">
                                            <span>
                                                <MapPin size={14} />
                                                Venue name
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Oticon Hall, Building 302"
                                                className="manual-event-input"
                                                value={form.venueName}
                                                onChange={(event) => handleFieldChange('venueName', event.target.value)}
                                            />
                                        </label>

                                        <label className="manual-event-field manual-event-field-wide">
                                            <span>Address</span>
                                            <input
                                                type="text"
                                                placeholder="Anker Engelunds Vej 1, 2800 Kongens Lyngby"
                                                className="manual-event-input"
                                                value={form.address}
                                                onChange={(event) => handleFieldChange('address', event.target.value)}
                                            />
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
                                            <span>Cover image</span>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                                                className="manual-event-input"
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0] || null;
                                                    handleFieldChange('coverImageFile', file);
                                                }}
                                            />
                                        </label>

                                        <label className="manual-event-field">
                                            <span>
                                                <Ticket size={14} />
                                                Ticket type
                                            </span>
                                            <select
                                                className="manual-event-input"
                                                value={form.ticketType}
                                                onChange={(event) => handleFieldChange('ticketType', event.target.value)}
                                            >
                                                <option>Free</option>
                                                <option>Paid</option>
                                                <option>RSVP only</option>
                                            </select>
                                        </label>

                                        <label className="manual-event-field">
                                            <span>Capacity</span>
                                            <input
                                                type="number"
                                                placeholder="120"
                                                className="manual-event-input"
                                                min={0}
                                                value={form.capacity}
                                                onChange={(event) => handleFieldChange('capacity', event.target.value)}
                                            />
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
                                            <input
                                                type="text"
                                                placeholder="A fast introduction to autonomous drone systems."
                                                className="manual-event-input"
                                                value={form.summary}
                                                onChange={(event) => handleFieldChange('summary', event.target.value)}
                                            />
                                        </label>

                                        <label className="manual-event-field manual-event-field-wide">
                                            <span>Tags</span>
                                            <input
                                                type="text"
                                                placeholder="robotics, ai, drones, engineering"
                                                className="manual-event-input"
                                                value={form.tags}
                                                onChange={(event) => handleFieldChange('tags', event.target.value)}
                                            />
                                        </label>

                                        <label className="manual-event-field manual-event-field-full">
                                            <span>Full description</span>
                                            <textarea
                                                className="manual-event-input manual-event-textarea"
                                                rows={7}
                                                placeholder="Describe agenda, speakers, expectations, and practical details..."
                                                value={form.description}
                                                onChange={(event) => handleFieldChange('description', event.target.value)}
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
                                        Save Draft (Disabled)
                                    </button>

                                    <button type="submit" className="manual-event-btn manual-event-btn-primary" disabled={isPublishing}>
                                        {isPublishing ? 'Publishing...' : 'Publish Event'}
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
