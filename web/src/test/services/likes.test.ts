import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLikedEventIdsAsync, isEventLiked, toggleLikedEvent, _resetLikesForTesting } from '../../services/likes';
import { apiCall } from '../../services/http';

vi.mock('../../services/http', () => ({
    apiCall: vi.fn(),
}));

const mockedApiCall = vi.mocked(apiCall);

function jsonResponse(body: unknown, status = 200, statusText = 'OK'): Response {
    return new Response(JSON.stringify(body), {
        status,
        statusText,
        headers: { 'Content-Type': 'application/json' },
    });
}

beforeEach(() => {
    localStorage.clear();
    _resetLikesForTesting();
    mockedApiCall.mockReset();
});

describe('likes service', () => {
    it('starts with no liked events for unknown users when backend is empty', async () => {
        mockedApiCall.mockResolvedValueOnce(jsonResponse({ eventIds: [] }));

        await expect(getLikedEventIdsAsync('missing-user')).resolves.toEqual([]);
        await expect(isEventLiked('missing-user', 'event-1')).resolves.toBe(false);
        expect(mockedApiCall).toHaveBeenCalledOnce();
        expect(mockedApiCall.mock.calls[0][0]).toContain('/api/users/me/likes');
    });

    it('returns empty array for null/undefined uid without calling the backend', async () => {
        await expect(getLikedEventIdsAsync(null)).resolves.toEqual([]);
        await expect(getLikedEventIdsAsync(undefined)).resolves.toEqual([]);
        expect(mockedApiCall).not.toHaveBeenCalled();
    });

    it('fetches likes from the backend and caches them per user', async () => {
        mockedApiCall.mockResolvedValueOnce(jsonResponse({ eventIds: ['event-1'] }));

        await expect(getLikedEventIdsAsync('backend-user')).resolves.toEqual(['event-1']);
        await expect(getLikedEventIdsAsync('backend-user')).resolves.toEqual(['event-1']);

        expect(mockedApiCall).toHaveBeenCalledOnce();
    });

    it('calls PUT when toggling an unliked event and updates cache after success', async () => {
        mockedApiCall
            .mockResolvedValueOnce(jsonResponse({ eventIds: [] }))
            .mockResolvedValueOnce(jsonResponse({ eventIds: ['event-1'] }));

        await expect(toggleLikedEvent('toggle-user', 'event-1')).resolves.toBe(true);

        const [, request] = mockedApiCall.mock.calls[1] as [string, RequestInit];
        expect(mockedApiCall.mock.calls[1][0]).toContain('/api/users/me/likes/event-1');
        expect(request.method).toBe('PUT');
        await expect(isEventLiked('toggle-user', 'event-1')).resolves.toBe(true);
    });

    it('calls DELETE when toggling a liked event and updates cache after success', async () => {
        mockedApiCall
            .mockResolvedValueOnce(jsonResponse({ eventIds: ['event-1'] }))
            .mockResolvedValueOnce(jsonResponse({ eventIds: [] }));

        await getLikedEventIdsAsync('toggle-user');
        await expect(toggleLikedEvent('toggle-user', 'event-1')).resolves.toBe(false);

        const [, request] = mockedApiCall.mock.calls[1] as [string, RequestInit];
        expect(request.method).toBe('DELETE');
        await expect(isEventLiked('toggle-user', 'event-1')).resolves.toBe(false);
    });

    it('does not update cache when a toggle request fails', async () => {
        mockedApiCall
            .mockResolvedValueOnce(jsonResponse({ eventIds: [] }))
            .mockResolvedValueOnce(jsonResponse({ message: 'nope' }, 500, 'Server Error'));

        await expect(toggleLikedEvent('failing-user', 'event-1')).rejects.toThrow('Failed to like event');
        await expect(isEventLiked('failing-user', 'event-1')).resolves.toBe(false);
    });

    it('merges legacy localStorage likes once and removes the legacy key on success', async () => {
        localStorage.setItem('unievent_likes_legacy-user', JSON.stringify(['event-1', 'event-2']));
        mockedApiCall.mockResolvedValueOnce(jsonResponse({ eventIds: ['event-1', 'event-2'] }));

        await expect(getLikedEventIdsAsync('legacy-user')).resolves.toEqual(['event-1', 'event-2']);

        const [, request] = mockedApiCall.mock.calls[0] as [string, RequestInit];
        expect(request.method).toBe('POST');
        expect(JSON.parse(request.body as string)).toEqual({ eventIds: ['event-1', 'event-2'] });
        expect(localStorage.getItem('unievent_likes_legacy-user')).toBeNull();
    });

    it('keeps the legacy localStorage key when migration fails', async () => {
        localStorage.setItem('unievent_likes_legacy-user', JSON.stringify(['event-1']));
        mockedApiCall.mockResolvedValueOnce(jsonResponse({ message: 'failed' }, 500, 'Server Error'));

        await expect(getLikedEventIdsAsync('legacy-user')).rejects.toThrow('Failed to migrate liked events');
        expect(localStorage.getItem('unievent_likes_legacy-user')).toBe(JSON.stringify(['event-1']));
    });
});
