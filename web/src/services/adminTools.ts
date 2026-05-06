import { BACKEND_URL } from '../constants';
import { createHttpError } from '../utils/authUtils';
import { sanitizeErrorMessage } from '../utils/securityUtils';
import { apiCall } from './http';

export type AdminPageSummary = {
    id: string;
    name: string;
    tokenStatus: string;
    tokenExpiresInDays: number | null;
};

export type AdminIngestResponse = {
    pageId: string;
    eventCount: number;
    eventTitles: string[];
};

export type AdminRefreshSummary = {
    refreshedCount: number;
    failedCount: number;
    durationMs: number;
};

export type AdminRefreshResult = {
    pageId: string;
    success: boolean;
    message: string;
};

export type AdminSeedResponse = {
    success: boolean;
    message: string;
    pageCount: number;
    eventCount: number;
    placeCount: number;
};

async function requestJson<T>(path: string, init: RequestInit): Promise<T> {
    const response = await apiCall(`${BACKEND_URL}${path}`, {
        ...init,
        skipAuthErrorHandling: true,
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({})) as Record<string, unknown>;
        throw createHttpError(
            response.status,
            (body.message as string | undefined) ?? response.statusText,
        );
    }

    return response.json() as Promise<T>;
}

export async function loadAdminPages(): Promise<AdminPageSummary[]> {
    return requestJson<AdminPageSummary[]>('/admin/tools/pages', { method: 'GET' });
}

export async function refreshAllAdminTokens(): Promise<AdminRefreshSummary> {
    return requestJson<AdminRefreshSummary>('/admin/tools/refresh-tokens', { method: 'POST' });
}

export async function refreshAdminToken(pageId: string): Promise<AdminRefreshResult> {
    return requestJson<AdminRefreshResult>(`/admin/tools/refresh-tokens/${pageId}`, { method: 'POST' });
}

export async function ingestAdminPage(pageId: string): Promise<AdminIngestResponse> {
    return requestJson<AdminIngestResponse>(`/admin/tools/ingest/${pageId}`, { method: 'POST' });
}

export async function seedAdminData(): Promise<AdminSeedResponse> {
    return requestJson<AdminSeedResponse>('/admin/tools/seed', { method: 'POST' });
}

export async function clearAdminData(): Promise<AdminSeedResponse> {
    return requestJson<AdminSeedResponse>('/admin/tools/seed', { method: 'DELETE' });
}

export function mapAdminToolsError(error: unknown): string {
    if (!(error instanceof Error) || !('status' in error)) {
        return sanitizeErrorMessage('Unable to run the admin tool right now. Please try again.');
    }

    const httpError = error as Error & { status: number };

    if (httpError.status === 401) {
        return sanitizeErrorMessage('You need to log in again to use admin tools.');
    }

    if (httpError.status === 403) {
        return sanitizeErrorMessage('You do not have permission to use this admin tool.');
    }

    if (httpError.status === 404) {
        return sanitizeErrorMessage('The requested page or admin tool was not found.');
    }

    return sanitizeErrorMessage(httpError.message || 'Something went wrong while running the admin tool.');
}