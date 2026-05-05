import { API_USER_LIKES, BACKEND_URL } from '../constants';
import { apiCall } from './http';

type LikedEventsResponse = {
  eventIds: string[];
};

const likesCache = new Map<string, Set<string>>();
const storageKey = (uid: string) => `unievent_likes_${uid}`;

function buildBackendUrl(path: string): string {
  return new URL(path, BACKEND_URL || window.location.origin).toString();
}

function readEventIds(data: unknown): string[] {
  if (
    typeof data === 'object'
    && data !== null
    && 'eventIds' in data
    && Array.isArray(data.eventIds)
  ) {
    return data.eventIds.filter((eventId): eventId is string => typeof eventId === 'string');
  }
  return [];
}

function loadLegacyLikes(uid: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(uid)) ?? '[]');
    return Array.isArray(parsed)
      ? parsed.filter((eventId): eventId is string => typeof eventId === 'string')
      : [];
  } catch {
    return [];
  }
}

function removeLegacyLikes(uid: string) {
  try {
    localStorage.removeItem(storageKey(uid));
  } catch {
    // The backend is authoritative; failed cleanup should not break likes.
  }
}

function getCachedLikes(uid: string): string[] {
  return Array.from(likesCache.get(uid) ?? new Set<string>());
}

function setCachedLikes(uid: string, nextLikes: Iterable<string>) {
  likesCache.set(uid, new Set(nextLikes));
}

async function parseLikedEventsResponse(response: Response, context: string): Promise<string[]> {
  if (!response.ok) {
    const statusDetails = response.statusText
      ? `${response.status} ${response.statusText}`
      : `${response.status}`;
    throw new Error(`${context}: ${statusDetails}`);
  }

  const data = await response.json() as LikedEventsResponse;
  return readEventIds(data);
}

async function fetchBackendLikes(): Promise<string[]> {
  const response = await apiCall(buildBackendUrl(API_USER_LIKES));
  return parseLikedEventsResponse(response, 'Failed to fetch liked events');
}

async function mergeLegacyLikes(uid: string, eventIds: string[]): Promise<string[]> {
  const response = await apiCall(buildBackendUrl(API_USER_LIKES), {
    method: 'POST',
    body: JSON.stringify({ eventIds }),
  });
  const merged = await parseLikedEventsResponse(response, 'Failed to migrate liked events');
  removeLegacyLikes(uid);
  return merged;
}

async function setBackendLike(eventId: string, liked: boolean): Promise<string[]> {
  const response = await apiCall(buildBackendUrl(`${API_USER_LIKES}/${encodeURIComponent(eventId)}`), {
    method: liked ? 'PUT' : 'DELETE',
  });
  return parseLikedEventsResponse(response, liked ? 'Failed to like event' : 'Failed to unlike event');
}

export async function getLikedEventIdsAsync(uid: string | null | undefined): Promise<string[]> {
  if (!uid) {
    return [];
  }

  if (likesCache.has(uid)) {
    return getCachedLikes(uid);
  }

  const legacyLikes = loadLegacyLikes(uid);
  const likedEventIds = legacyLikes.length > 0
    ? await mergeLegacyLikes(uid, legacyLikes)
    : await fetchBackendLikes();
  setCachedLikes(uid, likedEventIds);
  return likedEventIds;
}

export async function isEventLiked(uid: string | null | undefined, eventId: string): Promise<boolean> {
  const likedEventIds = await getLikedEventIdsAsync(uid);
  return likedEventIds.includes(eventId);
}

export async function toggleLikedEvent(uid: string, eventId: string): Promise<boolean> {
  const current = await getLikedEventIdsAsync(uid);
  const nextLiked = !current.includes(eventId);
  const backendLikes = await setBackendLike(eventId, nextLiked);
  setCachedLikes(uid, backendLikes);
  return backendLikes.includes(eventId);
}

export function _resetLikesForTesting(): void {
  likesCache.clear();
}
