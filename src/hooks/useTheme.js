import { useState, useEffect } from 'react';
import i18n from '../i18n';

export function useTheme() {
    // Global App State
    const [gameVersion, setGameVersion] = useState(() => localStorage.getItem('gameVersion') || 'ASA');
    const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('activeTheme') || 'arat-prime');
    const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

    // Apply Theme
    useEffect(() => {
        document.body.className = `theme-${activeTheme}`;
        const themeBackgrounds = {
            'arat-prime': 'aratprime.png',
            'tek-pulse': 'tekpulse.png',
            'primal-dawn': 'primaldawn.png',
            'aberrant-depths': 'aberrantdepths.png',
            'frozen-peaks': 'ash.png',
            'crystal-horizon': 'crystal.png'
        };
        const bgImage = themeBackgrounds[activeTheme] || 'aratprime.png';
        document.documentElement.style.setProperty('--bg-image', `url('/${bgImage}')`);
        localStorage.setItem('activeTheme', activeTheme);
    }, [activeTheme]);

    // Apply Language
    useEffect(() => {
        i18n.changeLanguage(language);
        localStorage.setItem('language', language);
    }, [language]);

    // Persist Game Version
    useEffect(() => {
        localStorage.setItem('gameVersion', gameVersion);
    }, [gameVersion]);

    const updateTheme = (newTheme) => {
        setActiveTheme(newTheme);
    };

    return {
        gameVersion,
        setGameVersion,
        activeTheme,
        setActiveTheme: updateTheme,
        language,
        setLanguage
    };
}
