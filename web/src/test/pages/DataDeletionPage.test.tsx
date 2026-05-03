import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { DataDeletionPage } from '../../pages/DataDeletionPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
    return render(
        <MemoryRouter>
            <DataDeletionPage />
        </MemoryRouter>
    );
}

describe('DataDeletionPage', () => {
    it('renders the page heading', () => {
        renderPage();

        expect(screen.getByRole('heading', { name: /data deletion/i })).toBeInTheDocument();
    });

    it('back button navigates to home', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: /back to events/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
