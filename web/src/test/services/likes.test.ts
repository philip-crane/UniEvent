import { beforeEach, describe, expect, it } from 'vitest';
import { getLikedEventIdsAsync, isEventLiked, toggleLikedEvent } from '../../services/likes';

// Reset localStorage and the module-level cache between tests.
// The cache lives in the module closure, so we re-import fresh each time via
// the module registry reset configured in vite.config.ts / vitest.config.ts.
// Clearing localStorage is enough to prevent storage bleed-through.
beforeEach(() => {
    localStorage.clear();
});

describe('likes service', () => {
    it('starts with no liked events for unknown users', async () => {
        await expect(getLikedEventIdsAsync('missing-user')).resolves.toEqual([]);
        await expect(isEventLiked('missing-user', 'event-1')).resolves.toBe(false);
    });

    it('returns empty array for null/undefined uid', async () => {
        await expect(getLikedEventIdsAsync(null)).resolves.toEqual([]);
        await expect(getLikedEventIdsAsync(undefined)).resolves.toEqual([]);
    });

    it('persists likes to localStorage and reads them back', async () => {
        await toggleLikedEvent('persist-user', 'event-1');
        const stored = JSON.parse(localStorage.getItem('unievent_likes_persist-user') ?? '[]');
        expect(stored).toContain('event-1');
    });

    it('toggles liked events per user and keeps users isolated', async () => {
        await expect(toggleLikedEvent('toggle-a', 'event-1')).resolves.toBe(true);
        await expect(isEventLiked('toggle-a', 'event-1')).resolves.toBe(true);

        await expect(toggleLikedEvent('toggle-b', 'event-1')).resolves.toBe(true);
        await expect(getLikedEventIdsAsync('toggle-a')).resolves.toEqual(['event-1']);
        await expect(getLikedEventIdsAsync('toggle-b')).resolves.toEqual(['event-1']);

        await expect(toggleLikedEvent('toggle-a', 'event-1')).resolves.toBe(false);
        await expect(getLikedEventIdsAsync('toggle-a')).resolves.toEqual([]);
        await expect(getLikedEventIdsAsync('toggle-b')).resolves.toEqual(['event-1']);
    });

    it('handles multiple events per user independently', async () => {
        await toggleLikedEvent('multi-user', 'event-a');
        await toggleLikedEvent('multi-user', 'event-b');

        await expect(isEventLiked('multi-user', 'event-a')).resolves.toBe(true);
        await expect(isEventLiked('multi-user', 'event-b')).resolves.toBe(true);

        await toggleLikedEvent('multi-user', 'event-a');
        await expect(isEventLiked('multi-user', 'event-a')).resolves.toBe(false);
        await expect(isEventLiked('multi-user', 'event-b')).resolves.toBe(true);
    });
});
