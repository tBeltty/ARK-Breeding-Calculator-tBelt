import { describe, it, expect } from 'vitest';
import { Session } from '../Session';

describe('Session Entity', () => {
    it('should create a valid session', () => {
        const session = new Session('123', 'Rex', 'Rexy');
        expect(session.id).toBe('123');
        expect(session.creature).toBe('Rex');
        expect(session.name).toBe('Rexy');
        expect(session.isPlaying).toBe(false);
        expect(session.maturationPct).toBe(0);
    });

    it('should throw if id or creature is missing', () => {
        expect(() => new Session(null, 'Rex')).toThrow('Session ID is required');
        expect(() => new Session('123', null)).toThrow('Creature species is required');
    });

    it('should toggle playing state', () => {
        const session = new Session('1', 'Raptor', 'Blue');
        expect(session.isPlaying).toBe(false);

        session.start();
        expect(session.isPlaying).toBe(true);

        session.pause();
        expect(session.isPlaying).toBe(false);

        session.toggle();
        expect(session.isPlaying).toBe(true);
    });

    it('should clamp maturation percentage between 0 and 100', () => {
        const session = new Session('1', 'Dodo', 'Dodi');

        session.update({ maturationPct: 150 });
        expect(session.maturationPct).toBe(100);

        session.update({ maturationPct: -50 });
        expect(session.maturationPct).toBe(0);

        session.update({ maturationPct: 50.5 });
        expect(session.maturationPct).toBe(50.5);
    });

    it('should serialize and deserialize correctly', () => {
        const original = new Session('1', 'Argentavis', 'Argy');
        original.start();
        original.update({ maturationPct: 42, weight: 500 });
        // Simulating extra data
        original.update({ selectedFood: 'Raw Meat', maxFood: 1000 });

        const dto = original.toDTO();
        const restored = Session.fromDTO(dto);
        restored.pause(); // Stop time for exact comparison if needed, or check original

        expect(restored).toBeInstanceOf(Session);
        expect(restored.id).toBe(original.id);
        expect(restored.isPlaying).toBe(false);
        expect(restored.maturationPct).toBeCloseTo(42, 1);
        expect(restored.weight).toBe(500);

        // Verify extra data
        expect(restored.extraData.selectedFood).toBe('Raw Meat');
        expect(restored.extraData.maxFood).toBe(1000);

        // Check DTO structure
        expect(dto.data.selectedFood).toBe('Raw Meat');
    });

    it('should preserve initialization data', () => {
        const session = new Session('1', 'Rex', 'Rexy', {
            weight: 100,
            selectedFood: 'Berries'
        });

        expect(session.weight).toBe(100);
        expect(session.extraData.selectedFood).toBe('Berries');

        const dto = session.toDTO();
        expect(dto.data.selectedFood).toBe('Berries');
    });

    it('should calculate maturation progress accurately over time', () => {
        const vi = import.meta.vitest.vi;
        vi.useFakeTimers();

        // 1 hour to mature
        const session = new Session('1', 'Rex', 'Rexy', {
            totalMaturationSeconds: 3600,
            maturationAtStart: 0
        });

        session.start();
        expect(session.maturationPct).toBe(0);

        // Advance 30 minutes (50%)
        vi.advanceTimersByTime(1800 * 1000);
        expect(session.maturationPct).toBeCloseTo(50, 1);

        // Advance another 1800 seconds (100%)
        vi.advanceTimersByTime(1800 * 1000);
        expect(session.maturationPct).toBe(100);

        vi.useRealTimers();
    });
});
