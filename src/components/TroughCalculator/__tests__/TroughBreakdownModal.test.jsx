import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TroughBreakdownModal } from '../TroughBreakdownModal';

// Mock Translation
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, options) => {
            // Simple mock to return the key and options for verification
            if (options && options.count !== undefined) return `${key} count:${options.count}`;
            if (options && options.hours !== undefined) return `${key} hours:${options.hours}`;
            return key;
        }
    })
}));

// Mock Modal Component since we only care about content rendering
vi.mock('../Modal', () => ({
    Modal: ({ children, title, footer, isOpen }) => (
        isOpen ? (
            <div data-testid="mock-modal">
                <h1>{title}</h1>
                <div data-testid="modal-content">{children}</div>
                <div data-testid="modal-footer">{footer}</div>
            </div>
        ) : null
    )
}));

describe('TroughBreakdownModal', () => {
    const mockData = {
        foodName: 'Raw Meat',
        totalStacks: 150,
        fullTroughs: 2,
        leftover: 30,
        maxDuration: 13.5,
        refillCount: 4
    };

    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        data: mockData,
        onFill: vi.fn(),
        maxSlots: 60
    };

    it('renders nothing when not open', () => {
        render(<TroughBreakdownModal {...defaultProps} isOpen={false} />);
        expect(screen.queryByTestId('mock-modal')).toBeNull();
    });

    it('renders correctly with full data', () => {
        render(<TroughBreakdownModal {...defaultProps} />);

        expect(screen.getByText('ui.breakdown_title')).toBeInTheDocument();
        expect(screen.getByText('ui.breakdown_total count:150')).toBeInTheDocument();
        expect(screen.getByText(/ui.breakdown_full/)).toBeInTheDocument();
        // Check partials
        expect(screen.getByText(/ui.breakdown_partial count:30/)).toBeInTheDocument();
        // Check refill info
        expect(screen.getByText(/ui.refill_every hours:13.5/)).toBeInTheDocument();
        expect(screen.getByText(/ui.refill_times count:4/)).toBeInTheDocument();
    });

    it('calls onFill when fill button is clicked', () => {
        render(<TroughBreakdownModal {...defaultProps} />);

        const button = screen.getByText('ui.fill_current count:60');
        fireEvent.click(button);

        expect(defaultProps.onFill).toHaveBeenCalledTimes(1);
    });

    it('hides refill info if not present', () => {
        const minimalData = { ...mockData, maxDuration: 0, refillCount: 0 };
        render(<TroughBreakdownModal {...defaultProps} data={minimalData} />);

        expect(screen.queryByText(/ui.refill_every/)).toBeNull();
        expect(screen.queryByText(/ui.refill_times/)).toBeNull();
    });
});
