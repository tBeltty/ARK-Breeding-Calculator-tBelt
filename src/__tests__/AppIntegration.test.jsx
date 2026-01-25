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
        expect(screen.getByText('ARK Breeding Calculator')).toBeDefined();
    });

    it('renders sidebar and content', () => {
        render(
            <MemoryRouter>
                <App />
            </MemoryRouter>
        );
        // Sidebar title
        expect(screen.getByText('Creatures')).toBeDefined();

        // ActiveSessionDetail content (default panel might be expanded or collapsed, but 'Maturation Details' is a header)
        // We can search for the "Creature Settings" panel title which is always rendered
        expect(screen.getByText(/Creature Settings/i)).toBeDefined();
    });
});
