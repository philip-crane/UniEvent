import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { EventPage } from '../../pages/EventPage';
import type { Event as EventType } from '../../types';

const mockUseEventPage = vi.fn();
const mockUseParams = vi.fn();

vi.mock('../../hooks/useEventPage', () => ({
    useEventPage: (id: string) => mockUseEventPage(id),
}));

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return {
        ...actual,
        useParams: () => mockUseParams(),
    };
});

// LikeButton uses both contexts.
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ currentUser: null }),
}));
vi.mock('../../context/LikesContext', () => ({
    useLikes: () => ({ likedIds: new Set(), isLiked: () => false, toggle: async () => false }),
}));

function makeEvent(overrides: Partial<EventType> = {}): EventType {
    return {
        id: 'evt-1',
        title: 'Test Concert',
        pageId: 'p1',
        startTime: '2026-06-15T18:00:00Z',
        endTime: '2026-06-15T22:00:00Z',
        description: 'A fun concert at DTU.',
        place: { name: 'DTU Campus' },
        ...overrides,
    } as EventType;
}

function defaultHookReturn(overrides: Partial<ReturnType<typeof mockUseEventPage>> = {}) {
    return {
        currentUser: null,
        event: null,
        isLoading: false,
        isSigningOut: false,
        showAddMenu: false,
        setShowAddMenu: vi.fn(),
        saveFeedback: '',
        addMenuRef: { current: null },
        handleLikeToggle: vi.fn(),
        handleSignOut: vi.fn(),
        userLabel: 'My Profile',
        organizerName: 'Test Org',
        coverImageUrl: '/cover.jpg',
        ...overrides,
    };
}

function renderPage() {
    return render(
        <MemoryRouter>
            <EventPage />
        </MemoryRouter>
    );
}

describe('EventPage', () => {
    beforeEach(() => {
        mockUseParams.mockReturnValue({ id: 'evt-1' });
        mockUseEventPage.mockReset();
        mockUseEventPage.mockReturnValue(defaultHookReturn());
    });

    it('shows loading message while fetching', () => {
        mockUseEventPage.mockReturnValue(defaultHookReturn({ isLoading: true }));
        renderPage();

        expect(screen.getByText('Loading event…')).toBeInTheDocument();
    });

    it('shows event not found when event is null and not loading', () => {
        renderPage();

        expect(screen.getByRole('heading', { name: 'Event not found' })).toBeInTheDocument();
    });

    it('shows the event title', () => {
        mockUseEventPage.mockReturnValue(defaultHookReturn({ event: makeEvent() }));
        renderPage();

        expect(screen.getByRole('heading', { name: 'Test Concert' })).toBeInTheDocument();
    });

    it('shows organizer name', () => {
        mockUseEventPage.mockReturnValue(defaultHookReturn({ event: makeEvent(), organizerName: 'DTU Events' }));
        renderPage();

        expect(screen.getByText(/organizer: dtu events/i)).toBeInTheDocument();
    });

    it('shows place name in details section', () => {
        mockUseEventPage.mockReturnValue(defaultHookReturn({ event: makeEvent() }));
        renderPage();

        expect(screen.getByText('DTU Campus')).toBeInTheDocument();
    });

    it('shows event description', () => {
        mockUseEventPage.mockReturnValue(defaultHookReturn({ event: makeEvent() }));
        renderPage();

        expect(screen.getByText('A fun concert at DTU.')).toBeInTheDocument();
    });

    it('shows "Location TBA" when event has no place', () => {
        mockUseEventPage.mockReturnValue(defaultHookReturn({ event: makeEvent({ place: undefined }) }));
        renderPage();

        expect(screen.getByText('Location TBA')).toBeInTheDocument();
    });

    it('shows "No description available" when description is absent', () => {
        mockUseEventPage.mockReturnValue(defaultHookReturn({ event: makeEvent({ description: '' }) }));
        renderPage();

        expect(screen.getByText(/no description available/i)).toBeInTheDocument();
    });

    it('"Add to calendar" button calls setShowAddMenu', async () => {
        const user = userEvent.setup();
        const setShowAddMenu = vi.fn();
        mockUseEventPage.mockReturnValue(defaultHookReturn({ event: makeEvent(), setShowAddMenu }));
        renderPage();

        await user.click(screen.getByRole('button', { name: 'Add event to calendar' }));

        expect(setShowAddMenu).toHaveBeenCalled();
    });

    it('shows calendar options when add menu is open', () => {
        mockUseEventPage.mockReturnValue(defaultHookReturn({ event: makeEvent(), showAddMenu: true }));
        renderPage();

        expect(screen.getByRole('button', { name: 'Google Calendar' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Apple Calendar' })).toBeInTheDocument();
    });

    it('shows save feedback text', () => {
        mockUseEventPage.mockReturnValue(defaultHookReturn({ event: makeEvent(), saveFeedback: 'Saved to your profile.' }));
        renderPage();

        expect(screen.getByText('Saved to your profile.')).toBeInTheDocument();
    });
});
