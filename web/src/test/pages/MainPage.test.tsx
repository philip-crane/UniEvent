import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MainPage } from '../../pages/MainPage';
import type { Event as EventType, SortMode } from '../../types';

// Mock the hook so we control exactly what state the page sees.
const mockUseMainPage = vi.fn();
vi.mock('../../hooks/useMainPage', () => ({
    useMainPage: () => mockUseMainPage(),
}));

// LikeButton (rendered inside EventCard) uses both auth and likes contexts.
vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ currentUser: null }),
}));
vi.mock('../../context/LikesContext', () => ({
    useLikes: () => ({ likedIds: new Set(), isLiked: () => false, toggle: async () => false }),
}));

function makeEvent(id: string, title: string): EventType {
    return {
        id,
        title,
        pageId: 'p1',
        startTime: new Date(Date.now() + 86400000).toISOString(),
        description: '',
    } as EventType;
}

function defaultHookReturn(overrides: Partial<ReturnType<typeof mockUseMainPage>> = {}) {
    return {
        currentUser: null,
        pages: [],
        list: [],
        loading: false,
        error: '',
        isSigningOut: false,
        fbConnecting: false,
        fbMessage: null,
        pageIds: [],
        setPageIds: vi.fn(),
        query: '',
        setQuery: vi.fn(),
        fromDate: '',
        setFromDate: vi.fn(),
        toDate: '',
        setToDate: vi.fn(),
        sortMode: 'upcoming' as SortMode,
        setSortMode: vi.fn(),
        viewMode: 'list' as const,
        setViewMode: vi.fn(),
        count: 0,
        invalidRange: false,
        userLabel: '',
        handleFacebookConnect: vi.fn(),
        handleSignOut: vi.fn(),
        ...overrides,
    };
}

function renderPage() {
    return render(
        <MemoryRouter>
            <MainPage />
        </MemoryRouter>
    );
}

describe('MainPage', () => {
    beforeEach(() => {
        mockUseMainPage.mockReset();
        mockUseMainPage.mockReturnValue(defaultHookReturn());
    });

    it('shows the page title', () => {
        renderPage();

        expect(screen.getAllByRole('heading', { name: 'UniEvent' }).length).toBeGreaterThan(0);
    });

    it('shows loading text while fetching events', () => {
        mockUseMainPage.mockReturnValue(defaultHookReturn({ loading: true }));
        renderPage();

        expect(screen.getByText('Loading…')).toBeInTheDocument();
    });

    it('shows error message when loading fails', () => {
        mockUseMainPage.mockReturnValue(defaultHookReturn({ error: 'Failed to load events' }));
        renderPage();

        expect(screen.getByText('Failed to load events')).toBeInTheDocument();
    });

    it('shows event count', () => {
        const events = [makeEvent('e1', 'Campus Concert'), makeEvent('e2', 'Hackathon')];
        mockUseMainPage.mockReturnValue(defaultHookReturn({ list: events, count: 2 }));
        renderPage();

        expect(screen.getByText('2 events found')).toBeInTheDocument();
    });

    it('shows singular "event" when count is 1', () => {
        mockUseMainPage.mockReturnValue(defaultHookReturn({ list: [makeEvent('e1', 'Solo Event')], count: 1 }));
        renderPage();

        expect(screen.getByText('1 event found')).toBeInTheDocument();
    });

    it('shows Login link when no user is logged in', () => {
        renderPage();

        expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    });

    it('shows user menu button when logged in', () => {
        mockUseMainPage.mockReturnValue(defaultHookReturn({
            currentUser: { uid: 'u1', email: 'alice@example.com', role: 'user', username: 'alice' } as never,
            userLabel: 'alice',
        }));
        renderPage();

        expect(screen.getByRole('button', { name: /open account menu/i })).toBeInTheDocument();
    });

    it('shows organizer tools section for organizer role', () => {
        mockUseMainPage.mockReturnValue(defaultHookReturn({
            currentUser: { uid: 'u1', email: 'org@example.com', role: 'organizer', username: 'org' } as never,
        }));
        renderPage();

        expect(screen.getByRole('button', { name: 'Connect Facebook' })).toBeInTheDocument();
    });

    it('hides organizer tools section for regular user', () => {
        mockUseMainPage.mockReturnValue(defaultHookReturn({
            currentUser: { uid: 'u1', email: 'user@example.com', role: 'user', username: 'user' } as never,
        }));
        renderPage();

        expect(screen.queryByRole('button', { name: 'Connect Facebook' })).not.toBeInTheDocument();
    });

    it('switches to calendar view when calendar button is clicked', async () => {
        const user = userEvent.setup();
        const setViewMode = vi.fn();
        mockUseMainPage.mockReturnValue(defaultHookReturn({ setViewMode }));
        renderPage();

        await user.click(screen.getByRole('button', { name: /calendar/i }));

        expect(setViewMode).toHaveBeenCalledWith('calendar');
    });

    it('shows invalid date range warning', () => {
        mockUseMainPage.mockReturnValue(defaultHookReturn({ invalidRange: true }));
        renderPage();

        expect(screen.getByText(/end date is before start date/i)).toBeInTheDocument();
    });

    it('shows profile and logout links in user menu when open', async () => {
        const user = userEvent.setup();
        mockUseMainPage.mockReturnValue(defaultHookReturn({
            currentUser: { uid: 'u1', email: 'alice@example.com', role: 'user', username: 'alice' } as never,
            userLabel: 'alice',
        }));
        renderPage();

        await user.click(screen.getByRole('button', { name: /open account menu/i }));

        expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    });
});
