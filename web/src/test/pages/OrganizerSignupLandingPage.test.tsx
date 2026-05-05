import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { OrganizerSignupLandingPage } from '../../pages/OrganizerSignupLandingPage';

function renderPage() {
    return render(
        <MemoryRouter>
            <OrganizerSignupLandingPage />
        </MemoryRouter>
    );
}

describe('OrganizerSignupLandingPage', () => {
    it('renders the page heading', () => {
        renderPage();

        expect(screen.getByRole('heading', { name: 'Organizer Signup' })).toBeInTheDocument();
    });

    it('shows a link to the organizer registration page for users with a key', () => {
        renderPage();

        const link = screen.getByRole('link', { name: 'Already Have a Key Code' });
        expect(link).toHaveAttribute('href', '/signup-organizer');
    });

    it('shows a link back to the organizer overview', () => {
        renderPage();

        expect(screen.getByRole('link', { name: 'Back to Organizer Overview' })).toBeInTheDocument();
    });

    it('shows a link back to the event feed', () => {
        renderPage();

        expect(screen.getByRole('link', { name: 'Back to Events' })).toBeInTheDocument();
    });

    it('shows an external link to the key request form', () => {
        renderPage();

        const link = screen.getByRole('link', { name: 'Request New Key' });
        expect(link).toHaveAttribute('target', '_blank');
    });
});
