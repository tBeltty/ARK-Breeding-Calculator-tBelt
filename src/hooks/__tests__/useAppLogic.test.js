
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppLogic } from '../useAppLogic';
import { NotificationManager } from '../../infrastructure/NotificationManager';

// Mocks
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key) => key }),
}));

vi.mock('../../infrastructure/LocalStorageSettingsRepository', () => ({
    loadSettings: () => ({
        maturationSpeed: 1,
        hatchSpeed: 1,
        consumptionSpeed: 1,
        autoRatesEnabled: false
    }),
    saveSettings: vi.fn(),
}));

vi.mock('../../infrastructure/NotificationManager', () => ({
    NotificationManager: {
        requestPermission: vi.fn(),
    },
}));

vi.mock('../../application/usecases/CreateSession', () => ({
    CreateSession: {
        execute: vi.fn((data) => ({
            id: 'test-session-id',
            ...data.initialData,
            clone: () => ({ ...data.initialData, id: 'test-session-id' }),
            softReset: vi.fn()
        })),
    },
}));

vi.mock('../../application/usecases/UpdateSession', () => ({
    UpdateSession: {
        execute: vi.fn((session, updates) => ({ ...session, ...updates })),
    },
}));

vi.mock('../../domain/breeding', () => ({
    calculateMaturationTime: () => 1000,
}));

vi.mock('../../i18n', () => ({
    default: {
        changeLanguage: vi.fn(),
    },
}));

describe('useAppLogic Hook (Regression Tests)', () => {
    let addToastMock;

    beforeEach(() => {
        addToastMock = vi.fn();
        vi.clearAllMocks();

        global.fetch = vi.fn(() => Promise.resolve({
            ok: true,
            json: () => Promise.resolve([])
        }));

        // Reset localStorage mocks if any
        global.localStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
        };
    });

    it('should initialize with default state', () => {
        const { result } = renderHook(() => useAppLogic(addToastMock));

        expect(result.current.settings.maturationSpeed).toBe(1);
        expect(result.current.sessions).toEqual([]);
        expect(result.current.activeSessionId).toBeNull();
        expect(result.current.isAddModalOpen).toBe(false);
        expect(result.current.isSettingsModalOpen).toBe(false);
    });

    it('should update global settings', () => {
        const { result } = renderHook(() => useAppLogic(addToastMock));

        act(() => {
            result.current.updateGlobalSetting('maturationSpeed', 50);
        });

        expect(result.current.settings.maturationSpeed).toBe(50);
    });

    it('should reset rates when auto-rates are disabled', () => {
        const { result } = renderHook(() => useAppLogic(addToastMock));

        // First set some non-default values
        act(() => {
            result.current.updateGlobalSetting('maturationSpeed', 50);
        });

        // Disable auto-rates
        act(() => {
            result.current.updateGlobalSetting('autoRatesEnabled', false);
        });

        expect(result.current.settings.maturationSpeed).toBe(1);
        expect(result.current.settings.hatchSpeed).toBe(1);
    });

    it('should toggle notification permission', async () => {
        const { result } = renderHook(() => useAppLogic(addToastMock));
        NotificationManager.requestPermission.mockResolvedValue(true);

        await act(async () => {
            await result.current.handleNotifyToggle();
        });

        expect(NotificationManager.requestPermission).toHaveBeenCalled();
        expect(result.current.notifyEnabled).toBe(true);
        expect(addToastMock).toHaveBeenCalledWith('messages.notification_enabled', 'success');
    });

    it('should open and close modals', () => {
        const { result } = renderHook(() => useAppLogic(addToastMock));

        act(() => {
            result.current.handleOpenAddModal();
        });
        expect(result.current.isAddModalOpen).toBe(true);

        act(() => {
            result.current.setIsAddModalOpen(false);
        });
        expect(result.current.isAddModalOpen).toBe(false);
    });

    it('should handle adding a session', () => {
        const { result } = renderHook(() => useAppLogic(addToastMock));

        const sessionData = {
            creature: 'Rex',
            name: 'Rexy',
            isPlaying: true
        };

        act(() => {
            result.current.handleAddSession(sessionData);
        });

        expect(result.current.sessions).toHaveLength(1);
        expect(result.current.sessions[0].name).toBe('Rexy');
    });
});
