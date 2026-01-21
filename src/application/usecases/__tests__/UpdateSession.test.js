import { describe, it, expect } from 'vitest';
import { UpdateSession } from '../UpdateSession';
import { CreateSession } from '../CreateSession';
import { Session } from '../../../domain/Session';

describe('UpdateSession Use Case', () => {
    it('should update a session with object updates', () => {
        const session = new Session('1', 'Rex', 'Rexy', { weight: 100 });
        const updated = UpdateSession.execute(session, {
            data: { weight: 200, maturationPct: 50, isPlaying: true }
        });

        expect(updated).not.toBe(session); // Immutability check
        expect(updated.weight).toBe(200);
        expect(updated.maturationPct).toBe(50);
        expect(updated.isPlaying).toBe(true);
    });

    it('should update a session with function updates', () => {
        const session = new Session('1', 'Rex', 'Rexy', { weight: 100 });
        const updated = UpdateSession.execute(session, (s) => ({
            data: { weight: s.weight + 50 }
        }));

        expect(updated.weight).toBe(150);
    });

    it('should preserve extra data during update', () => {
        const session = new Session('1', 'Rex', 'Rexy', {
            weight: 100,
            selectedFood: 'Meat'
        });

        const updated = UpdateSession.execute(session, {
            data: { weight: 200, maxFood: 1000 }
        });

        expect(updated.weight).toBe(200);
        expect(updated.extraData.selectedFood).toBe('Meat');
        expect(updated.extraData.maxFood).toBe(1000);
    });

    it('should handle App.jsx style atomic updates with spread (Legacy Compatibility)', () => {
        // 1. Create session with some extra data
        const session = CreateSession.execute({
            initialData: {
                creature: 'Rex',
                weight: 100,
                maxFood: 5000,
                selectedFood: 'Meat'
            }
        });

        // 2. Simulate App.jsx getting activeData
        const activeData = session.data;
        expect(activeData.weight).toBe(100);

        // 3. Simulate App.jsx updateDinoData
        const updates = {
            data: {
                ...activeData,
                weight: 200
            }
        };

        const updatedSession = UpdateSession.execute(session, updates);

        // 4. Verify data integrity
        expect(updatedSession.weight).toBe(200);
        expect(updatedSession.data.maxFood).toBe(5000);
        expect(updatedSession.data.selectedFood).toBe('Meat');
    });
});
