import { useState, useEffect } from 'react';
import { loadSettings, saveSettings } from '../infrastructure/LocalStorageSettingsRepository';

export function useSettings() {
    const [settings, setSettings] = useState(loadSettings);

    useEffect(() => {
        saveSettings(settings);
    }, [settings]);

    const updateGlobalSetting = (key, value) => {
        setSettings(prev => {
            const newSettings = { ...prev, [key]: value };
            // Reset rates to x1 if Auto-Rates is disabled
            if (key === 'autoRatesEnabled' && value === false) {
                console.log('[Settings] Auto-Rates disabled. Resetting to 1x.');
                newSettings.maturationSpeed = 1;
                newSettings.hatchSpeed = 1;
                newSettings.consumptionSpeed = 1;
            }
            return newSettings;
        });
    };

    return {
        settings,
        setSettings,
        updateGlobalSetting
    };
}
