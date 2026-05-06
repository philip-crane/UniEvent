import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useProfilePage } from '../../hooks/useProfilePage';
import type { Event as EventType, User } from '../../types';

const mockNavigate = vi.fn();
const mockGetEvents = vi.fn();
const mockGetAccountProfile = vi.fn();
const mockLogout = vi.fn();
const mockGetFacebookAuthUrl = vi.fn();

let mockCurrentUser: User | null = null;
let mockIsLoading = false;
let mockLikedIds = new Set<string>();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/dal', () => ({
    getEvents: () => mockGetEvents(),
}));

vi.mock('../../services/auth', () => ({
    getAccountProfile: (...args: unknown[]) => mockGetAccountProfile(...args),
    logout: () => mockLogout(),
}));

vi.mock('../../services/facebook', () => ({
    getFacebookAuthUrl: () => mockGetFacebookAuthUrl(),
}));

vi.mock('../../context/AuthContext', () => ({
    useAuth: () => ({ currentUser: mockCurrentUser, isLoading: mockIsLoading }),
}));

vi.mock('../../context/LikesContext', () => ({
    useLikes: () => ({ likedIds: mockLikedIds }),
}));

function user(overrides: Partial<User> = {}): User {
    return {
        uid: 'user-1',
        email: 'alice@example.com',
        username: 'alice',
        role: 'user',
        organizerNames: [],
        ...overrides,
    } as User;
}

function event(id: string, startTime: string): EventType {
    return {
        id,
        pageId: 'page-1',
        title: `Event ${id}`,
        startTime,
        description: '',
    } as EventType;
}

describe('useProfilePage', () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockGetEvents.mockReset();
        mockGetAccountProfile.mockReset();
        mockLogout.mockReset();
        mockGetFacebookAuthUrl.mockReset();
        mockCurrentUser = user();
        mockIsLoading = false;
        mockLikedIds = new Set();
        vi.spyOn(window, 'confirm').mockReturnValue(true);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('redirects anonymous users to login after auth loading completes', () => {
        mockCurrentUser = null;

        renderHook(() => useProfilePage());

        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
    });

    it('does not redirect while auth is still loading', () => {
        mockCurrentUser = null;
        mockIsLoading = true;

        renderHook(() => useProfilePage());

        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('loads account profile data and overrides the current user role details', async () => {
        mockCurrentUser = user({ role: 'user', organizerNames: [] });
        mockGetAccountProfile.mockResolvedValueOnce({
            role: 'organizer',
            organizerNames: ['DTU Events', 'Tech Society'],
        });
        mockGetEvents.mockResolvedValueOnce([]);

        const { result } = renderHook(() => useProfilePage());

        await waitFor(() => {
            expect(result.current.accountRole).toBe('organizer');
        });
        expect(result.current.organizerNames).toEqual(['DTU Events', 'Tech Society']);
        expect(mockGetAccountProfile).toHaveBeenCalledWith('user-1');
    });

    it('falls back to current user role details when profile loading fails', async () => {
        mockCurrentUser = user({ role: 'admin', organizerNames: ['Fallback Org'] });
        mockGetAccountProfile.mockRejectedValueOnce(new Error('profile failed'));
        mockGetEvents.mockResolvedValueOnce([]);

        const { result } = renderHook(() => useProfilePage());

        await waitFor(() => {
            expect(result.current.accountRole).toBe('admin');
        });
        expect(result.current.organizerNames).toEqual(['Fallback Org']);
    });

    it('loads, filters, and sorts liked events for the current user', async () => {
        mockLikedIds = new Set(['liked-later', 'liked-sooner']);
        mockGetAccountProfile.mockResolvedValueOnce({ role: 'user', organizerNames: [] });
        mockGetEvents.mockResolvedValueOnce([
            event('unliked', '2099-05-10T12:00:00.000Z'),
            event('liked-later', '2099-05-09T12:00:00.000Z'),
            event('liked-sooner', '2099-05-08T12:00:00.000Z'),
        ]);

        const { result } = renderHook(() => useProfilePage());

        await waitFor(() => expect(result.current.isLoadingLikedEvents).toBe(false));
        expect(result.current.likedEvents.map((item) => item.id)).toEqual(['liked-sooner', 'liked-later']);
    });

    it('skips liked event loading when there is no current user id', async () => {
        mockCurrentUser = null;
        mockGetAccountProfile.mockResolvedValueOnce({ role: 'user', organizerNames: [] });

        const { result } = renderHook(() => useProfilePage());

        await waitFor(() => expect(result.current.isLoadingLikedEvents).toBe(false));
        expect(result.current.likedEvents).toEqual([]);
        expect(mockGetEvents).not.toHaveBeenCalled();
    });

    it('shows a Facebook error when connect URL creation fails', async () => {
        mockGetAccountProfile.mockResolvedValueOnce({ role: 'organizer', organizerNames: [] });
        mockGetEvents.mockResolvedValueOnce([]);
        mockGetFacebookAuthUrl.mockRejectedValueOnce(new Error('Facebook unavailable'));
        const { result } = renderHook(() => useProfilePage());
        await waitFor(() => expect(result.current.isLoadingLikedEvents).toBe(false));

        await act(async () => {
            await result.current.handleFacebookConnect();
        });

        expect(result.current.fbError).toBe('Facebook unavailable');
        expect(result.current.fbConnecting).toBe(false);
    });

    it('does not log out when the confirmation is cancelled', async () => {
        vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
        mockGetAccountProfile.mockResolvedValueOnce({ role: 'user', organizerNames: [] });
        mockGetEvents.mockResolvedValueOnce([]);
        const { result } = renderHook(() => useProfilePage());
        await waitFor(() => expect(result.current.isLoadingLikedEvents).toBe(false));

        await act(async () => {
            await result.current.handleSignOut();
        });

        expect(mockLogout).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalledWith('/login', { replace: true });
    });

    it('logs out and navigates to login after confirmation', async () => {
        mockGetAccountProfile.mockResolvedValueOnce({ role: 'user', organizerNames: [] });
        mockGetEvents.mockResolvedValueOnce([]);
        mockLogout.mockResolvedValueOnce(undefined);
        const { result } = renderHook(() => useProfilePage());
        await waitFor(() => expect(result.current.isLoadingLikedEvents).toBe(false));

        await act(async () => {
            await result.current.handleSignOut();
        });

        expect(mockLogout).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
        expect(result.current.isSigningOut).toBe(false);
    });
});
