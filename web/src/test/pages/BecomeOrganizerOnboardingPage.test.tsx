import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { BecomeOrganizerOnboardingPage } from '../../pages/BecomeOrganizerOnboardingPage';

function renderPage() {
    return render(
        <MemoryRouter>
            <BecomeOrganizerOnboardingPage />
        </MemoryRouter>
    );
}

describe('BecomeOrganizerOnboardingPage', () => {
    it('renders the main heading', () => {
        renderPage();

        expect(screen.getByRole('heading', { name: 'Become an Organizer' })).toBeInTheDocument();
    });

    it('shows all four onboarding steps', () => {
        renderPage();

        expect(screen.getByText('Step 1: Request a Key')).toBeInTheDocument();
        expect(screen.getByText('Step 2: We Review in 24 Hours')).toBeInTheDocument();
        expect(screen.getByText('Step 3: Receive Key by Email')).toBeInTheDocument();
        expect(screen.getByText('Step 4: Create Account and Publish')).toBeInTheDocument();
    });

    it('shows a link to continue to organizer signup', () => {
        renderPage();

        const link = screen.getByRole('link', { name: 'Continue to Organizer Signup' });
        expect(link).toHaveAttribute('href', '/signup-organizer-landing');
    });

    it('shows a back to home link', () => {
        renderPage();

        expect(screen.getByRole('link', { name: 'Back to Home' })).toBeInTheDocument();
    });
});
