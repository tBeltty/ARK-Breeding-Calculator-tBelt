import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import React from 'react';

// Mock child components to isolate App logic verification
vi.mock('../components/Session/ActiveSessionDetail', () => ({
    ActiveSessionDetail: () => <div data-testid="active-session-detail">Active Session Detail</div>
}));

vi.mock('../components/Layout/MainLayout', () => ({
    MainLayout: ({ children, sidebar }) => (
        <div data-testid="main-layout">
            <div data-testid="sidebar">{sidebar}</div>
            <div data-testid="content">{children}</div>
        </div>
    )
}));

// Mock expensive/complex hooks or providers if needed
// For now, let's try to render the real App with mocked UI leaves

describe('App Integration', () => {
    beforeEach(() => {
        // Bypass onboarding
        localStorage.setItem('onboardingCompleted', 'true');
    });

    it('renders without crashing', () => {
        render(<App />);
        expect(screen.getByTestId('main-layout')).toBeDefined();
    });

    it('renders sidebar and content', () => {
        render(<App />);
        expect(screen.getByTestId('sidebar')).toBeDefined();
        // Check if ActiveSessionDetail is rendered (might need session state to be present)
        // By default hook initializes a session, so it should appear
        expect(screen.getByTestId('active-session-detail')).toBeDefined();
    });
});
