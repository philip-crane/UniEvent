import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ManualEventPage } from '../../pages/ManualEventPage';

const mockCreatePage = vi.fn();
const mockCreateEvent = vi.fn();
const mockUploadEventCover = vi.fn();

vi.mock('../../services/dal', () => ({
    createPage: (...args: unknown[]) => mockCreatePage(...args),
    createEvent: (...args: unknown[]) => mockCreateEvent(...args),
    uploadEventCover: (...args: unknown[]) => mockUploadEventCover(...args),
}));

function renderPage() {
    return render(
        <MemoryRouter>
            <ManualEventPage />
        </MemoryRouter>
    );
}

function fillRequiredFields() {
    fireEvent.change(screen.getByLabelText('Event title'), { target: { value: 'Autonomous Drone Night' } });
    fireEvent.change(screen.getByLabelText('Organizer display name'), { target: { value: 'DTU Robotics Society!' } });
    fireEvent.change(screen.getByLabelText('Start date'), { target: { value: '2026-06-01' } });
    fireEvent.change(screen.getByLabelText('Start time'), { target: { value: '10:30' } });
}

describe('ManualEventPage', () => {
    beforeEach(() => {
        mockCreatePage.mockReset();
        mockCreateEvent.mockReset();
        mockUploadEventCover.mockReset();
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the manual event form', () => {
        renderPage();

        expect(screen.getByRole('heading', { name: 'Create Manual Event' })).toBeInTheDocument();
        expect(screen.getByLabelText('Event title')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Publish Event' })).toBeInTheDocument();
    });

    it('shows a validation error when required fields are missing', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: 'Publish Event' }));

        expect(screen.getByRole('alert')).toHaveTextContent('Event title is required.');
        expect(mockCreatePage).not.toHaveBeenCalled();
        expect(mockCreateEvent).not.toHaveBeenCalled();
    });

    it('rejects an end time before the start time', async () => {
        const user = userEvent.setup();
        renderPage();

        fillRequiredFields();
        fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-06-01' } });
        fireEvent.change(screen.getByLabelText('End time'), { target: { value: '09:30' } });
        await user.click(screen.getByRole('button', { name: 'Publish Event' }));

        expect(screen.getByRole('alert')).toHaveTextContent('End time must be after start time.');
        expect(mockCreatePage).not.toHaveBeenCalled();
    });

    it('creates an organizer page and event with enriched details', async () => {
        const user = userEvent.setup();
        const createdPage = {
            id: 'dtu-robotics-society',
            name: 'DTU Robotics Society!',
            url: 'https://facebook.com/dtu-robotics-society',
            active: true,
        };
        const createdEvent = {
            id: 'event-1',
            pageId: createdPage.id,
            title: 'Autonomous Drone Night',
            startTime: new Date('2026-06-01T10:30').toISOString(),
        };
        mockCreatePage.mockResolvedValueOnce(createdPage);
        mockCreateEvent.mockResolvedValueOnce(createdEvent);
        renderPage();

        fillRequiredFields();
        fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Hackathon' } });
        fireEvent.change(screen.getByLabelText('Audience'), { target: { value: 'Students only' } });
        fireEvent.change(screen.getByLabelText('End date'), { target: { value: '2026-06-01' } });
        fireEvent.change(screen.getByLabelText('End time'), { target: { value: '13:00' } });
        fireEvent.change(screen.getByLabelText(/Venue name/), { target: { value: 'Oticon Hall' } });
        fireEvent.change(screen.getByLabelText('Address'), { target: { value: 'Anker Engelunds Vej 1' } });
        fireEvent.change(screen.getByLabelText(/Ticket type/), { target: { value: 'RSVP only' } });
        fireEvent.change(screen.getByLabelText('Capacity'), { target: { value: '120' } });
        fireEvent.change(screen.getByLabelText('Short summary'), { target: { value: 'Build and test autonomous drones.' } });
        fireEvent.change(screen.getByLabelText('Tags'), { target: { value: 'robotics, drones' } });
        fireEvent.change(screen.getByLabelText('Full description'), { target: { value: 'Bring a laptop and curiosity.' } });
        await user.click(screen.getByRole('button', { name: 'Publish Event' }));

        await waitFor(() => {
            expect(mockCreatePage).toHaveBeenCalledWith({
                id: 'dtu-robotics-society',
                name: 'DTU Robotics Society!',
                url: 'https://facebook.com/dtu-robotics-society',
                active: true,
            });
        });
        expect(mockCreateEvent).toHaveBeenCalledWith({
            pageId: 'dtu-robotics-society',
            title: 'Autonomous Drone Night',
            description: [
                'Build and test autonomous drones.',
                'Bring a laptop and curiosity.',
                'Tags: robotics, drones',
                'Category: Hackathon',
                'Audience: Students only',
                'Ticket: RSVP only',
                'Capacity: 120',
            ].join('\n\n'),
            startTime: new Date('2026-06-01T10:30').toISOString(),
            endTime: new Date('2026-06-01T13:00').toISOString(),
            place: {
                name: 'Oticon Hall',
                location: { street: 'Anker Engelunds Vej 1' },
            },
        });
        expect(screen.getByRole('status')).toHaveTextContent('Published "Autonomous Drone Night" successfully.');
        expect(screen.getByLabelText('Event title')).toHaveValue('');
    });

    it('uploads the cover image after the event is created', async () => {
        const user = userEvent.setup();
        const file = new File(['image-bytes'], 'cover.png', { type: 'image/png' });
        mockCreatePage.mockResolvedValueOnce({ id: 'dtu-events', name: 'DTU Events', active: true });
        mockCreateEvent.mockResolvedValueOnce({
            id: 'event-99',
            pageId: 'dtu-events',
            title: 'Autonomous Drone Night',
            startTime: new Date('2026-06-01T10:30').toISOString(),
        });
        mockUploadEventCover.mockResolvedValueOnce({});
        renderPage();

        fillRequiredFields();
        await user.upload(screen.getByLabelText('Cover image'), file);
        await user.click(screen.getByRole('button', { name: 'Publish Event' }));

        await waitFor(() => {
            expect(mockUploadEventCover).toHaveBeenCalledWith('event-99', file);
        });
    });

    it('keeps the event publish successful when cover upload fails', async () => {
        const user = userEvent.setup();
        const file = new File(['image-bytes'], 'cover.png', { type: 'image/png' });
        mockCreatePage.mockResolvedValueOnce({ id: 'dtu-events', name: 'DTU Events', active: true });
        mockCreateEvent.mockResolvedValueOnce({
            id: 'event-99',
            pageId: 'dtu-events',
            title: 'Autonomous Drone Night',
            startTime: new Date('2026-06-01T10:30').toISOString(),
        });
        mockUploadEventCover.mockRejectedValueOnce(new Error('upload failed'));
        renderPage();

        fillRequiredFields();
        await user.upload(screen.getByLabelText('Cover image'), file);
        await user.click(screen.getByRole('button', { name: 'Publish Event' }));

        await waitFor(() => {
            expect(screen.getByRole('status')).toHaveTextContent('Published "Autonomous Drone Night" successfully.');
        });
        expect(console.warn).toHaveBeenCalledWith('Cover image upload failed', expect.any(Error));
    });

    it('shows the backend error when page creation fails', async () => {
        const user = userEvent.setup();
        mockCreatePage.mockRejectedValueOnce(new Error('Organizer page already exists'));
        renderPage();

        fillRequiredFields();
        await user.click(screen.getByRole('button', { name: 'Publish Event' }));

        await waitFor(() => {
            expect(screen.getByRole('alert')).toHaveTextContent('Organizer page already exists');
        });
        expect(mockCreateEvent).not.toHaveBeenCalled();
    });
});
