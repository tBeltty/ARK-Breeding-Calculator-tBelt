import { describe, it, expect } from 'vitest';
import { CreateSession } from '../CreateSession';
import { Session } from '../../../domain/Session';

describe('CreateSession Use Case', () => {
    it('should create a valid session from string input', () => {
        const session = CreateSession.execute({
            initialData: 'Rex',
            existingCount: 0
        });

        expect(session).toBeInstanceOf(Session);
        expect(session.creature).toBe('Rex');
        expect(session.name).toBe('Rex 1');
    });

    it('should create a valid session from object input', () => {
        const session = CreateSession.execute({
            initialData: {
                creature: 'Raptor',
                name: 'Blue',
                weight: 150,
                isPlaying: true
            },
            existingCount: 2
        });

        expect(session).toBeInstanceOf(Session);
        expect(session.creature).toBe('Raptor');
        expect(session.name).toBe('Blue');
        expect(session.weight).toBe(150);
        expect(session.isPlaying).toBe(true);
    });
});
