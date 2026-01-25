import { useEffect, useRef } from 'react';

/**
 * Hook to handle real-time maturation updates.
 * 
 * @param {Object} params
 * @param {boolean} params.isPlaying - Whether the timer is active
 * @param {number} params.totalSeconds - Total seconds to reach 100%
 * @param {number} params.currentMaturation - Current maturation (0.0 to 1.0)
 * @param {Function} params.onUpdate - Callback(newMaturation) to persist changes
 * @param {number} [params.intervalMs=1000] - Update interval (default 1s)
 */
export function useMaturationTimer({
    isPlaying,
    totalSeconds,
    currentMaturation,
    onUpdate,
    intervalMs = 1000
}) {
    const callbackRef = useRef(onUpdate);

    // Keep callback ref fresh to avoid closure staleness if dependencies change
    useEffect(() => {
        callbackRef.current = onUpdate;
    }, [onUpdate]);

    useEffect(() => {
        if (!isPlaying || !totalSeconds || currentMaturation >= 1) return;

        const interval = setInterval(() => {
            // Calculate increment for the interval
            // 1.0 (100%) / totalSeconds = amount per second
            // amount per second * (intervalMs / 1000) = amount per tick
            const incrementPerSecond = 1 / totalSeconds;
            const incrementPerTick = incrementPerSecond * (intervalMs / 1000);

            const nextMaturation = Math.min(1, currentMaturation + incrementPerTick);

            if (callbackRef.current) {
                callbackRef.current(nextMaturation);
            }
        }, intervalMs);

        return () => clearInterval(interval);
    }, [isPlaying, totalSeconds, currentMaturation, intervalMs]);
}
