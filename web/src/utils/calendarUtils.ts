import type { Event } from '../types';

function formatYmdhms(date: Date) {
  // Google/ICS wants UTC in YYYYMMDDTHHMMSSZ format
  const pad = (num: number) => String(num).padStart(2, '0');
  return (
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    'T' +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    'Z'
  );
}

function safeDate(dateIso: string | undefined): Date | undefined {
  if (!dateIso) return undefined;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

function escapeIcsText(text: string | undefined): string {
  return (text || '')
    .replace(/\\/g, '\\\\')    // Backslash first (to avoid double-escaping)
    .replace(/;/g, '\\;')      // Semicolon
    .replace(/,/g, '\\,')      // Comma
    .replace(/\n/g, '\\n');    // Newline
}

export function buildGoogleCalendarUrl(event: Event): string {
  const start = safeDate(event.startTime);
  const end = safeDate(event.endTime) ?? (start ? new Date(start.getTime() + 1000 * 60 * 60 * 2) : undefined);

  const dates = start && end ? `${formatYmdhms(start)}/${formatYmdhms(end)}` : '';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || '',
    dates,
    details: event.description || '',
    location: event.place?.name || '',
    sprop: 'website:' + (event.eventURL || ''),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildIcs(event: Event): string {
  const start = safeDate(event.startTime);
  const end = safeDate(event.endTime) ?? (start ? new Date(start.getTime() + 1000 * 60 * 60 * 2) : undefined);
  const now = new Date();

  const dtstamp = formatYmdhms(now);
  const dtstart = start ? formatYmdhms(start) : dtstamp;
  const dtend = end ? formatYmdhms(end) : dtstart;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UniEventClient//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@unievent`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}`,
  ];

  if (event.place?.name) {
    lines.push(`LOCATION:${escapeIcsText(event.place.name)}`);
  }

  if (event.eventURL) {
    lines.push(`URL:${escapeIcsText(event.eventURL)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

export function downloadIcs(event: Event) {
  const ics = buildIcs(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(event.title || 'event').replace(/[^\w\s-]/g, '')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
