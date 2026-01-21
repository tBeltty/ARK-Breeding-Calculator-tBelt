import { renderHook, act } from '@testing-library/react';
import { useMaturationTimer } from '../useMaturationTimer';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useMaturationTimer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.useRealTimers();
    });

    it('should not update if not playing', () => {
        const onUpdate = vi.fn();
        renderHook(() => useMaturationTimer({
            isPlaying: false,
            totalSeconds: 100,
            currentMaturation: 0,
            onUpdate
        }));

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(onUpdate).not.toHaveBeenCalled();
    });

    it('should increment maturation correctly', () => {
        const onUpdate = vi.fn();
        const totalSeconds = 100; // 1% per second

        renderHook(() => useMaturationTimer({
            isPlaying: true,
            totalSeconds,
            currentMaturation: 0,
            onUpdate
        }));

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // 1 sec / 100 sec = 0.01 increment
        expect(onUpdate).toHaveBeenCalledWith(0.01);
    });

    it('should stop at 1.0 (100%)', () => {
        const onUpdate = vi.fn();
        const totalSeconds = 100;

        renderHook(() => useMaturationTimer({
            isPlaying: true,
            totalSeconds,
            currentMaturation: 0.995,
            onUpdate
        }));

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        // 0.995 + 0.01 = 1.005 -> clamped to 1
        expect(onUpdate).toHaveBeenCalledWith(1);
    });

    it('should adapt to custom interval', () => {
        const onUpdate = vi.fn();
        const totalSeconds = 100;

        renderHook(() => useMaturationTimer({
            isPlaying: true,
            totalSeconds,
            currentMaturation: 0,
            onUpdate,
            intervalMs: 500 // Half second
        }));

        act(() => {
            vi.advanceTimersByTime(500);
        });

        // 0.01 per sec -> 0.005 per 500ms
        expect(onUpdate).toHaveBeenCalledWith(0.005);
    });
});
