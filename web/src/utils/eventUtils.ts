import type { Event, Page } from '../types';

const dateTimeFormatter = new Intl.DateTimeFormat('da-DK', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const timeFormatter = new Intl.DateTimeFormat('da-DK', { hour: '2-digit', minute: '2-digit' });

export const DEFAULT_EVENT_COVER_IMAGE_URL = '/dtuevent-logo.png';

export function formatEventStart(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function formatTimeRange(startTime: string, endTime?: string): string {
  const start = timeFormatter.format(new Date(startTime));
  if (!endTime) return start;
  return `${start} - ${timeFormatter.format(new Date(endTime))}`;
}

export function getOrganizerName(event: Event | null, pages: Page[]): string {
  if (!event) return 'Unknown';
  const eventData = event as Event & { organizerName?: string; pageName?: string };
  if (eventData.organizerName) return eventData.organizerName;
  if (eventData.pageName) return eventData.pageName;
  return pages.find((page) => page.id === event.pageId)?.name ?? 'Unknown';
}

export function getEventUrl(id: string, explicit?: string): string {
  return explicit ?? `https://facebook.com/events/${id}`;
}

export function getEventCoverImageUrl(coverImageUrl?: string): string {
  const trimmed = coverImageUrl?.trim();
  return trimmed ? trimmed : DEFAULT_EVENT_COVER_IMAGE_URL;
}

