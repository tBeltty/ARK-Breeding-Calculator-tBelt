/**
 * Backup Service
 * Orchestrates the Export and Import of application state.
 */

import { LocalStorageSettingsRepository } from './LocalStorageSettingsRepository';
import { validateBackup } from '../domain/backupSchema';
import { version } from '../../package.json';

const SESSION_KEY = 'ark-breeding-calculator-active-sessions'; // From LocalStorageSessionRepository logic (checking key name...)
// From LocalStorageSessionRepository.js
const STORAGE_KEY_SESSIONS = 'ark_breeding_sessions';

// Helper for download
const triggerDownload = (data, filename) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export class BackupService {
    /**
     * Export all data to a JSON file
     */
    static exportData() {
        try {
            // 1. Gather Data
            const settings = LocalStorageSettingsRepository.loadSettings();

            // We need to manually duplicate the logic to read the raw sessions because
            // LocalStorageSessionRepository might return Entities, but we want raw DTO-like structure for backup?
            // Or better, let's trust the storage keys.
            // Wait, LocalStorageSessionRepository.loadAll() returns Entities.
            // Let's read raw from localStorage to be safe and simple, 
            // OR use the repositories if we want to be clean.
            // Let's use repositories.

            // Actually, we don't have a direct "getAll" on SessionRepository readily imported here without instantiating it.
            // Let's peek at localStorage directly for this Infrastructure Service
            // Wait, checking LocalStorageSessionRepository.js content from previous turns...
            // It exports `loadAll()`... no wait, user only edited `loadSettings`.

            // Let's safely read from localStorage primitives.
            // Read raw sessions using correct key
            const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
            const sessions = storedSessions ? JSON.parse(storedSessions) : [];

            const global = {
                gameVersion: localStorage.getItem('gameVersion') || 'ASA',
                activeTheme: localStorage.getItem('activeTheme') || 'arat-prime',
                language: localStorage.getItem('language') || 'en',
                notifyEnabled: localStorage.getItem('notifyEnabled') === 'true'
            };

            const payload = {
                version: 1, // Backup Schema Version
                timestamp: Date.now(),
                appVersion: version,
                global,
                settings,
                sessions
            };

            const date = new Date().toISOString().split('T')[0];
            triggerDownload(payload, `ark-breeding-backup-${date}.json`);
            return true;
        } catch (e) {
            console.error('Export failed', e);
            throw new Error('Failed to create backup');
        }
    }

    /**
     * Import data from a JSON file
     * @param {File} file Uploaded file
     * @returns {Promise<boolean>} Success
     */
    static async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const json = JSON.parse(e.target.result);
                    const validData = validateBackup(json);

                    if (!validData) {
                        reject(new Error('Invalid backup file format or version.'));
                        return;
                    }

                    // Restore Data
                    // 1. Settings
                    LocalStorageSettingsRepository.saveSettings(validData.settings);

                    // 2. Global
                    localStorage.setItem('gameVersion', validData.global.gameVersion);
                    localStorage.setItem('activeTheme', validData.global.activeTheme);
                    localStorage.setItem('language', validData.global.language);
                    localStorage.setItem('notifyEnabled', validData.global.notifyEnabled);

                    // 3. Sessions
                    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(validData.sessions));

                    // 4. Resolve
                    resolve(true);

                } catch (err) {
                    console.error('Import Parsing Error', err);
                    reject(new Error('Failed to parse backup file.'));
                }
            };

            reader.readAsText(file);
        });
    }
}
