
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActiveSessionDetail } from '../ActiveSessionDetail';

// We acknowledge that mocks are not working for relative imports in this setup,
// so we test against the real rendered output (Integration Test).

// Mocks for libraries that definitely work
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../../domain/breeding', () => ({
    formatTime: () => '10:00',
    calculateMaturationTime: () => 1000,
    calculateBufferTime: () => 500
}));

vi.mock('../../../domain/constants/nicknames', () => ({
    getNickname: () => 'Alpha'
}));

vi.mock('../../infrastructure/NotificationManager', () => ({
    NotificationManager: {
        requestPermission: vi.fn(),
        schedule: vi.fn(() => 'test-id')
    },
}));

vi.mock('../../hooks/useToast', () => ({
    useToast: () => ({ addToast: vi.fn() })
}));

describe('ActiveSessionDetail Component (Regression Tests)', () => {
    const mockSession = {
        id: '1',
        name: 'Test Session',
        creature: 'Rex',
        maturationPct: 50,
        data: {
            isPlaying: false,
            weight: 500,
            foodTrackingEnabled: false
        }
    };

    const mockCalculations = {
        maturationTime: 1000,
        maturationTimeRemaining: 500,
        maturationTimeComplete: 500,
        babyTime: 100,
        totalFoodItems: 50,
        currentBuffer: 300,
        totalHandFeedPct: 10,
        birthLabel: 'Incubation',
        birthTime: 100,
        toJuvFoodItems: 20,
        toAdultFoodItems: 30,
        currentFoodRate: 0.1,
        foodCapacity: 100
    };

    const mockProps = {
        session: mockSession,
        calculations: mockCalculations,
        settings: {
            maturationSpeed: 1,
            advancedMode: true
        },
        onUpdateSession: vi.fn(),
        onTogglePanel: vi.fn(),
        onUpdateGlobalSettings: vi.fn(),
        panelStates: { creature: true, baby: true, settings: true, maturation: true, food: true },
        creatures: { Rex: { name: 'Rex', weight: 500 } },
        foods: {},
        availableFoods: [],
        trackedServers: []
    };

    it('should render weight input', () => {
        const { container } = render(<ActiveSessionDetail {...mockProps} />);
        const weightInput = container.querySelector('[data-input-id="fields.weight"]');
        expect(weightInput).toBeInTheDocument();
        expect(weightInput).toHaveValue('500');
    });

    it('should allow updating weight', () => {
        const { container } = render(<ActiveSessionDetail {...mockProps} />);
        const weightInput = container.querySelector('[data-input-id="fields.weight"]');

        fireEvent.change(weightInput, { target: { value: '600' } });
        fireEvent.blur(weightInput);

        expect(mockProps.onUpdateSession).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ weight: 600 })
        }));
    });

    it('should render notifications button', () => {
        const { container } = render(<ActiveSessionDetail {...mockProps} />);
        const notifyBtn = container.querySelector('button[title="ui.set_notification"]');
        expect(notifyBtn).toBeInTheDocument();
    });
});
