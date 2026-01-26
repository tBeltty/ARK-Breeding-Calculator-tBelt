import { beforeEach, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import React from 'react';

// using real components for true integration testing
import { ActiveSessionDetail } from '../components/Session/ActiveSessionDetail';
import { MainLayout } from '../components/Layout/MainLayout';

import { MemoryRouter } from 'react-router-dom';

describe('App Integration', () => {
    beforeEach(() => {
        // Bypass onboarding
        localStorage.setItem('onboardingCompleted', 'v2.5');
    });

    it('renders without crashing', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        // Check for main title in Header
        expect(screen.getByText(/Arktic Assistant/i)).toBeDefined();
    });

    it('renders sidebar and content', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        // Sidebar title
        expect(screen.getByText('Creatures')).toBeDefined();

        // ActiveSessionDetail content (default panel might be expanded or collapsed, but 'No Creatures Tracked' is the empty state)
        expect(screen.getByText(/No Creatures Tracked/i)).toBeDefined();
    });
});
