import { useEffect, useRef } from 'react';
import { calculateMaturationTime } from '@/domain/breeding';

/**
 * Custom hook to automatically calculate desired duration based on creature maturation.
 * 
 * @param {boolean} isAutoDuration - Whether auto-duration mode is enabled
 * @param {Array} creatureList - List of creatures in the trough
 * @param {Object} creatures - Creature data lookup
 * @param {Object} settings - Server settings
 * @param {Function} setDesiredHours - Setter for desired hours
 */
export function useAutoDuration(isAutoDuration, creatureList, creatures, settings, setDesiredHours) {
    const prevAutoRef = useRef(isAutoDuration);

    // Reset hours when switching from Auto to Manual
    useEffect(() => {
        if (prevAutoRef.current && !isAutoDuration) {
            setDesiredHours(0);
        }
        prevAutoRef.current = isAutoDuration;
    }, [isAutoDuration, setDesiredHours]);

    // Calculate max maturation time when in Auto mode
    useEffect(() => {
        if (isAutoDuration && creatureList.length > 0) {
            let maxSeconds = 0;

            creatureList.forEach(entry => {
                const creatureData = creatures[entry.name];
                if (creatureData) {
                    const totalMaturationTime = calculateMaturationTime(creatureData, settings);
                    const currentProgress = entry.maturation || 0;
                    const remainingSeconds = totalMaturationTime * (1 - currentProgress);
                    if (remainingSeconds > maxSeconds) {
                        maxSeconds = remainingSeconds;
                    }
                }
            });

            const hours = maxSeconds / 3600;
            setDesiredHours(Number(hours.toFixed(2)));
        }
    }, [isAutoDuration, creatureList, settings, creatures, setDesiredHours]);
}
