const likesCache = new Map<string, Set<string>>();

const storageKey = (uid: string) => `unievent_likes_${uid}`;

function loadFromStorage(uid: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey(uid)) ?? '[]');
  } catch {
    return [];
  }
}

function saveToStorage(uid: string, likes: string[]) {
  try {
    localStorage.setItem(storageKey(uid), JSON.stringify(likes));
  } catch {
    // quota exceeded or private-browsing - in-memory cache remains valid
  }
}

function getCachedLikes(uid: string): string[] {
  return Array.from(likesCache.get(uid) ?? new Set<string>());
}

function setCachedLikes(uid: string, nextLikes: Iterable<string>) {
  likesCache.set(uid, new Set(nextLikes));
}

export async function getLikedEventIdsAsync(uid: string | null | undefined): Promise<string[]> {
  if (!uid) {
    return [];
  }

  if (likesCache.has(uid)) {
    return getCachedLikes(uid);
  }

  const stored = loadFromStorage(uid);
  setCachedLikes(uid, stored);
  return stored;
}

export async function isEventLiked(uid: string | null | undefined, eventId: string): Promise<boolean> {
  const likedEventIds = await getLikedEventIdsAsync(uid);
  return likedEventIds.includes(eventId);
}

export async function toggleLikedEvent(uid: string, eventId: string): Promise<boolean> {
  const current = await getLikedEventIdsAsync(uid);
  const next = new Set(current);
  if (next.has(eventId)) {
    next.delete(eventId);
  } else {
    next.add(eventId);
  }

  setCachedLikes(uid, next);
  saveToStorage(uid, Array.from(next));
  return next.has(eventId);
}
