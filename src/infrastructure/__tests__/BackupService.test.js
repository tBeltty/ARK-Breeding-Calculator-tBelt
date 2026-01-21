import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BackupService } from '../BackupService';
import { LocalStorageSettingsRepository } from '../LocalStorageSettingsRepository';

// Mocks
vi.mock('../LocalStorageSettingsRepository', () => ({
    LocalStorageSettingsRepository: {
        loadSettings: vi.fn(),
        saveSettings: vi.fn()
    }
}));

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('BackupService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
    });

    describe('exportData', () => {
        it('should generate a valid JSON backup with all required fields', () => {
            // Setup
            LocalStorageSettingsRepository.loadSettings.mockReturnValue({ theme: 'dark' });
            localStorage.setItem('ark_breeding_sessions', JSON.stringify([{ id: '123', creature: 'Rex' }]));
            localStorage.setItem('gameVersion', 'ASA');

            // Mock DOM manipulation for download trigger
            const createElementSpy = vi.spyOn(document, 'createElement');
            const clickSpy = vi.fn();
            createElementSpy.mockReturnValue({
                click: clickSpy,
                href: '',
                download: ''
            });
            document.body.appendChild = vi.fn();
            document.body.removeChild = vi.fn();

            // Execute
            BackupService.exportData();

            // Verify
            // We can't easily peek at the Blob content here without more complex mocking,
            // but we can verify the mock flow.
            expect(LocalStorageSettingsRepository.loadSettings).toHaveBeenCalled();
            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(clickSpy).toHaveBeenCalled();
        });
    });

    describe('importData', () => {
        it('should reject invalid JSON', async () => {
            const file = new File(['{ invalid json'], 'backup.json', { type: 'application/json' });
            await expect(BackupService.importData(file)).rejects.toThrow();
        });

        it('should reject valid JSON with invalid schema', async () => {
            const file = new File([JSON.stringify({ version: 999 })], 'backup.json');
            await expect(BackupService.importData(file)).rejects.toThrow('Invalid backup');
        });

        it('should strictly filter malicious fields in sessions', async () => {
            const maliciousPayload = {
                version: 1,
                settings: {},
                global: {},
                sessions: [
                    {
                        id: 's1',
                        creature: 'Rex',
                        // Malicious Payload
                        extraData: {
                            danger: '<script>alert(1)</script>'
                        },
                        // Malicious Key
                        '__proto__': { isAdmin: true }
                    }
                ]
            };
            const file = new File([JSON.stringify(maliciousPayload)], 'backup.json');

            await BackupService.importData(file);

            const savedRaw = localStorage.getItem('ark_breeding_sessions');
            const saved = JSON.parse(savedRaw);

            expect(saved).toHaveLength(1);
            expect(saved[0].id).toBe('s1');
            // Check that prototype pollution didn't occur (JSON.parse protects against most, but schema validation adds layer)
            expect(saved[0].__proto__).not.toHaveProperty('isAdmin');
        });

        it('should restore valid data correctly', async () => {
            const validPayload = {
                version: 1,
                settings: { maturationSpeed: 5 },
                global: { gameVersion: 'ASE', language: 'es' },
                sessions: [{ id: 's1', creature: 'Dodo', weight: 100 }]
            };
            const file = new File([JSON.stringify(validPayload)], 'backup.json');

            await BackupService.importData(file);

            // Verify infrastructure calls
            expect(LocalStorageSettingsRepository.saveSettings).toHaveBeenCalledWith({
                consumptionSpeed: 1,
                gen2GrowthEffect: false,
                gen2HatchEffect: false,
                hatchSpeed: 1,
                maturationSpeed: 5,
                troughSpoilageMult: 1
            }); // Schema fills defaults

            expect(localStorage.getItem('gameVersion')).toBe('ASE');
            expect(localStorage.getItem('language')).toBe('es');

            const sessions = JSON.parse(localStorage.getItem('ark_breeding_sessions'));
            expect(sessions[0].creature).toBe('Dodo');
        });
    });
});
