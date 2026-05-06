import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createEvent, createPage, getEventById, getEvents, getPages, uploadEventCover } from '../../services/dal';
import { resetCsrfTokenForTesting, setCsrfToken } from '../../services/csrf';

const mockFetch = vi.fn();

function jsonResponse(body: unknown, status = 200, statusText = 'OK'): Response {
    return new Response(JSON.stringify(body), {
        status,
        statusText,
        headers: { 'Content-Type': 'application/json' },
    });
}

beforeEach(() => {
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
    resetCsrfTokenForTesting();
});

describe('dal service', () => {
    it('maps fetched pages into app page format', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({
            content: [
                { id: 'p-1', name: 'S-Huset', url: 'https://example.com/shuset', active: true },
            ],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 100,
            hasNext: false,
            hasPrevious: false,
        }));

        const pages = await getPages();

        expect(pages).toEqual([
            { id: 'p-1', name: 'S-Huset', url: 'https://example.com/shuset', active: true },
        ]);

        const [firstCallUrl] = mockFetch.mock.calls[0] as [string];
        const url = new URL(firstCallUrl);
        expect(url.pathname).toBe('/api/pages');
        expect(url.searchParams.get('page')).toBe('0');
        expect(url.searchParams.get('size')).toBe('100');
    });

    it('returns an empty page list when backend has no pages', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 100,
            hasNext: false,
            hasPrevious: false,
        }));

        await expect(getPages()).resolves.toEqual([]);
    });

    it('keeps working even if some page fields are missing', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({
            content: [{ id: 'p-2' }],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 100,
            hasNext: false,
            hasPrevious: false,
        }));

        await expect(getPages()).resolves.toEqual([
            { id: 'p-2', name: undefined, url: undefined, active: undefined },
        ]);
    });

    it('passes through network errors when loading pages', async () => {
        const readError = new Error('pages read failed');
        mockFetch.mockRejectedValueOnce(readError);

        await expect(getPages()).rejects.toBe(readError);
    });

    it('maps fetched events into app event format', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({
            content: [
                {
                    id: 'e-1',
                    pageId: 'p-1',
                    title: 'Friday Bar',
                    description: 'Live music',
                    startTime: '2026-02-10T17:00:00.000Z',
                    endTime: '2026-02-10T22:00:00.000Z',
                    place: { name: 'DTU' },
                    coverImageId: 42,
                    eventUrl: 'https://example.com/event/e-1',
                    createdAt: '2026-01-01T10:00:00.000Z',
                    updatedAt: '2026-01-02T10:00:00.000Z',
                },
            ],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 100,
            hasNext: false,
            hasPrevious: false,
        }));

        const events = await getEvents();

        expect(events).toEqual([
            {
                id: 'e-1',
                pageId: 'p-1',
                title: 'Friday Bar',
                description: 'Live music',
                startTime: '2026-02-10T17:00:00.000Z',
                endTime: '2026-02-10T22:00:00.000Z',
                place: { name: 'DTU' },
                coverImageUrl: expect.stringMatching(/\/media\/42$/),
                eventURL: 'https://example.com/event/e-1',
                createdAt: '2026-01-01T10:00:00.000Z',
                updatedAt: '2026-01-02T10:00:00.000Z',
            },
        ]);

        const [firstCallUrl] = mockFetch.mock.calls[0] as [string];
        const url = new URL(firstCallUrl);
        expect(url.pathname).toBe('/api/events');
        expect(url.searchParams.get('page')).toBe('0');
        expect(url.searchParams.get('size')).toBe('100');
        expect(url.searchParams.get('sort')).toBe('startTime,asc');
    });

    it('returns an empty event list when backend has no events', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 100,
            hasNext: false,
            hasPrevious: false,
        }));

        await expect(getEvents()).resolves.toEqual([]);
    });

    it('keeps working even if some event fields are missing', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({
            content: [
                {
                    id: 'e-missing',
                    pageId: 'p-1',
                    title: 'Event Without Extras',
                    startTime: '2026-03-01T12:00:00.000Z',
                    createdAt: '2026-01-01T00:00:00.000Z',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                },
            ],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 100,
            hasNext: false,
            hasPrevious: false,
        }));

        await expect(getEvents()).resolves.toEqual([
            {
                id: 'e-missing',
                pageId: 'p-1',
                title: 'Event Without Extras',
                description: undefined,
                startTime: '2026-03-01T12:00:00.000Z',
                endTime: undefined,
                place: undefined,
                coverImageUrl: undefined,
                eventURL: undefined,
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ]);
    });

    it('throws a fetch status error when loading events fails', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'boom' }, 500, 'Internal Server Error'));

        await expect(getEvents()).rejects.toThrow('Failed to fetch events: 500 Internal Server Error - boom');
    });

    it('returns null when event does not exist', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({}, 404, 'Not Found'));

        await expect(getEventById('missing')).resolves.toBeNull();
    });

    it('passes through network errors when loading one event', async () => {
        const readError = new Error('single event read failed');
        mockFetch.mockRejectedValueOnce(readError);

        await expect(getEventById('fail')).rejects.toBe(readError);
    });

    it('maps fetched event to app event format', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({
            id: 'evt-1',
            pageId: 'page-1',
            title: 'Sample Event',
            description: 'Desc',
            startTime: '2026-01-01T12:00:00.000Z',
            endTime: '2026-01-01T14:00:00.000Z',
            place: { name: 'DTU' },
            coverImageId: 8,
            eventUrl: 'https://example.com/event',
            createdAt: '2025-12-01T10:00:00.000Z',
            updatedAt: '2025-12-02T10:00:00.000Z',
        }));

        await expect(getEventById('evt-1')).resolves.toEqual({
            id: 'evt-1',
            pageId: 'page-1',
            title: 'Sample Event',
            description: 'Desc',
            startTime: '2026-01-01T12:00:00.000Z',
            endTime: '2026-01-01T14:00:00.000Z',
            place: { name: 'DTU' },
            coverImageUrl: expect.stringMatching(/\/media\/8$/),
            eventURL: 'https://example.com/event',
            createdAt: '2025-12-01T10:00:00.000Z',
            updatedAt: '2025-12-02T10:00:00.000Z',
        });
    });

    it('posts a new page payload and maps the created page', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({
            id: 'page-1',
            name: 'DTU Robotics',
            url: 'https://facebook.com/dtu-robotics',
            active: true,
        }));

        const page = await createPage({
            id: 'page-1',
            name: 'DTU Robotics',
            url: 'https://facebook.com/dtu-robotics',
            active: true,
        });

        expect(page).toEqual({
            id: 'page-1',
            name: 'DTU Robotics',
            url: 'https://facebook.com/dtu-robotics',
            active: true,
        });
        const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(new URL(url).pathname).toBe('/api/pages');
        expect(options.method).toBe('POST');
        expect(options.credentials).toBe('include');
        expect(JSON.parse(options.body as string)).toEqual({
            id: 'page-1',
            name: 'DTU Robotics',
            url: 'https://facebook.com/dtu-robotics',
            active: true,
        });
    });

    it('posts a new event payload and maps the created event', async () => {
        mockFetch.mockResolvedValueOnce(jsonResponse({
            id: 'event-1',
            pageId: 'page-1',
            title: 'Robotics Night',
            description: 'Build robots',
            startTime: '2026-06-01T10:30:00.000Z',
            endTime: '2026-06-01T12:30:00.000Z',
            place: { name: 'Oticon Hall' },
            coverImageId: 12,
            eventUrl: 'https://example.com/events/event-1',
            createdAt: '2026-05-01T00:00:00.000Z',
            updatedAt: '2026-05-01T00:00:00.000Z',
        }));

        const event = await createEvent({
            pageId: 'page-1',
            title: 'Robotics Night',
            description: 'Build robots',
            startTime: '2026-06-01T10:30:00.000Z',
            endTime: '2026-06-01T12:30:00.000Z',
            place: { name: 'Oticon Hall' },
        });

        expect(event).toMatchObject({
            id: 'event-1',
            pageId: 'page-1',
            title: 'Robotics Night',
            coverImageUrl: expect.stringMatching(/\/media\/12$/),
        });
        const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(new URL(url).pathname).toBe('/api/events');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body as string)).toEqual({
            pageId: 'page-1',
            title: 'Robotics Night',
            description: 'Build robots',
            startTime: '2026-06-01T10:30:00.000Z',
            endTime: '2026-06-01T12:30:00.000Z',
            place: { name: 'Oticon Hall' },
        });
    });

    it('uploads an event cover image with the CSRF header', async () => {
        const file = new File(['image-bytes'], 'cover.png', { type: 'image/png' });
        setCsrfToken('csrf-token');
        mockFetch.mockResolvedValueOnce(jsonResponse({
            id: 'event-1',
            pageId: 'page-1',
            title: 'Robotics Night',
            startTime: '2026-06-01T10:30:00.000Z',
            coverImageId: 18,
        }));

        const event = await uploadEventCover('event-1', file);

        expect(event.coverImageUrl).toEqual(expect.stringMatching(/\/media\/18$/));
        const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
        expect(new URL(url).pathname).toBe('/api/events/event-1/coverImage');
        expect(options.method).toBe('POST');
        expect(options.credentials).toBe('include');
        expect(options.body).toBeInstanceOf(FormData);
        expect(options.headers).toBeInstanceOf(Headers);
        expect((options.headers as Headers).get('X-CSRF-Token')).toBe('csrf-token');
    });

    it('throws a detailed error when uploading an event cover image fails', async () => {
        const file = new File(['image-bytes'], 'cover.png', { type: 'image/png' });
        mockFetch.mockResolvedValueOnce(jsonResponse({ message: 'file too large' }, 413, 'Payload Too Large'));

        await expect(uploadEventCover('event-1', file))
            .rejects.toThrow('Failed to upload event cover image: 413 Payload Too Large - file too large');
    });
});
