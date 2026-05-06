import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildGoogleCalendarUrl, buildIcs } from '../../utils/calendarUtils';
import type { Event } from '../../types';

function event(overrides: Partial<Event> = {}): Event {
    return {
        id: 'event-1',
        pageId: 'page-1',
        title: 'Friday Bar',
        description: 'Music, food; and friends\nBring ID',
        startTime: '2026-05-07T18:00:00.000Z',
        endTime: '2026-05-07T21:30:00.000Z',
        place: { name: 'S-Huset, DTU' },
        eventURL: 'https://example.com/events/event-1',
        ...overrides,
    } as Event;
}

describe('calendarUtils', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-05-06T10:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('builds a Google Calendar URL with event details', () => {
        const url = new URL(buildGoogleCalendarUrl(event()));

        expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
        expect(url.searchParams.get('action')).toBe('TEMPLATE');
        expect(url.searchParams.get('text')).toBe('Friday Bar');
        expect(url.searchParams.get('dates')).toBe('20260507T180000Z/20260507T213000Z');
        expect(url.searchParams.get('details')).toBe('Music, food; and friends\nBring ID');
        expect(url.searchParams.get('location')).toBe('S-Huset, DTU');
        expect(url.searchParams.get('sprop')).toBe('website:https://example.com/events/event-1');
    });

    it('uses a two-hour default end time for calendar URLs without an end time', () => {
        const url = new URL(buildGoogleCalendarUrl(event({ endTime: undefined })));

        expect(url.searchParams.get('dates')).toBe('20260507T180000Z/20260507T200000Z');
    });

    it('builds an ICS event with escaped text fields', () => {
        const ics = buildIcs(event());

        expect(ics).toContain('BEGIN:VCALENDAR');
        expect(ics).toContain('DTSTAMP:20260506T100000Z');
        expect(ics).toContain('DTSTART:20260507T180000Z');
        expect(ics).toContain('DTEND:20260507T213000Z');
        expect(ics).toContain('SUMMARY:Friday Bar');
        expect(ics).toContain('DESCRIPTION:Music\\, food\\; and friends\\nBring ID');
        expect(ics).toContain('LOCATION:S-Huset\\, DTU');
        expect(ics).toContain('URL:https://example.com/events/event-1');
        expect(ics).toContain('END:VCALENDAR');
    });

    it('falls back to dtstamp when event dates are invalid', () => {
        const ics = buildIcs(event({ startTime: 'not-a-date', endTime: undefined }));

        expect(ics).toContain('DTSTART:20260506T100000Z');
        expect(ics).toContain('DTEND:20260506T100000Z');
    });
});
