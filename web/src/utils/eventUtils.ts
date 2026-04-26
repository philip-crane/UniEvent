// Utilities for event rendering and formatting

const dateTimeFormatter = new Intl.DateTimeFormat('da-DK', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const DEFAULT_EVENT_COVER_IMAGE_URL = '/dtuevent-logo.png';

export function formatEventStart(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

export function getEventUrl(id: string, explicit?: string): string {
  return explicit ?? `https://facebook.com/events/${id}`;
}

export function getEventCoverImageUrl(coverImageUrl?: string): string {
  const trimmed = coverImageUrl?.trim();
  return trimmed ? trimmed : DEFAULT_EVENT_COVER_IMAGE_URL;
}


