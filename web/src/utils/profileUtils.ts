import type { User, Event } from '../types';

export function buildUsername(user: User | null): string {
  if (!user) return 'username';

  const emailLocalPart = user.email?.split('@')[0]?.trim();
  if (emailLocalPart) return emailLocalPart;

  const displayName = user.displayName?.trim();
  if (displayName) return displayName.toLowerCase().replace(/\s+/g, '.');

  return 'username';
}

export function filterAndSortLikedEvents(events: Event[], likedEventIds: string[]): Event[] {
  const likedSet = new Set(likedEventIds);
  return events
    .filter((event) => likedSet.has(event.id))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}
