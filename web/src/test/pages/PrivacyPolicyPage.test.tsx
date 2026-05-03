import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { PrivacyPolicyPage } from '../../pages/PrivacyPolicyPage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

function renderPage() {
    return render(
        <MemoryRouter>
            <PrivacyPolicyPage />
        </MemoryRouter>
    );
}

describe('PrivacyPolicyPage', () => {
    it('renders the page heading', () => {
        renderPage();

        expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument();
    });

    it('back button navigates to home', async () => {
        const user = userEvent.setup();
        renderPage();

        await user.click(screen.getByRole('button', { name: /back to events/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/');
    });
});
