import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { getNickname } from '../../domain/constants/nicknames';
import { getCreatureIcon } from '../../presentation/assets/CreatureIcons';
import styles from './OnboardingWizard.module.css';

const STEPS = ['welcome', 'language', 'gameVersion', 'server', 'theme', 'notifications', 'creature'];

export function OnboardingWizard({
    creatures,
    globalSettings,
    onComplete
}) {
    const { t, i18n } = useTranslation();
    const [currentStep, setCurrentStep] = useState(0);

    // Local state for onboarding selections
    const [language, setLanguage] = useState(globalSettings.language || 'en');
    const [gameVersion, setGameVersion] = useState(globalSettings.gameVersion || 'ASA');
    const [theme, setTheme] = useState(globalSettings.activeTheme || 'arat-prime');
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    // Server selection state
    const [selectedServer, setSelectedServer] = useState(null);
    const [serverSearch, setServerSearch] = useState('');
    const [serverResults, setServerResults] = useState([]);
    const [isUnofficial, setIsUnofficial] = useState(false);
    const [unofficialIp, setUnofficialIp] = useState('');

    // Creature creation state
    const [selectedCreature, setSelectedCreature] = useState('');
    const [creatureName, setCreatureName] = useState('');
    const [creatureWeight, setCreatureWeight] = useState('');
    const [creatureMaturation, setCreatureMaturation] = useState('0');
    const [startTracking, setStartTracking] = useState(true);
    const [creatureSearch, setCreatureSearch] = useState('');

    // Handle Official Server Search
    useEffect(() => {
        if (!serverSearch || isUnofficial) {
            // Handled in onChange or no-op
        }

        const delayDebounceFn = setTimeout(async () => {
            try {
                const response = await fetch(`/api/servers/search?q=${encodeURIComponent(serverSearch)}`);
                if (response.ok) {
                    const data = await response.json();
                    setServerResults(data); // Returns matching servers
                }
            } catch (e) {
                console.error('Server search failed:', e);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [serverSearch, isUnofficial]);

    // Apply language changes in real-time for preview
    useEffect(() => {
        i18n.changeLanguage(language);
    }, [language, i18n]);

    // Apply theme changes in real-time for preview
    useEffect(() => {
        document.body.className = `theme-${theme}`;
    }, [theme]);

    const handleNext = useCallback(() => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    }, [currentStep]);

    const handleBack = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    const handleComplete = useCallback(async () => {
        // Apply all settings
        globalSettings.setLanguage(language);
        globalSettings.setGameVersion(gameVersion);
        globalSettings.setActiveTheme(theme);

        // Request notification permission if enabled
        if (notificationsEnabled && globalSettings.onToggleNotify) {
            await globalSettings.onToggleNotify();
        }

        // Create first creature session
        const creatureData = selectedCreature ? {
            creature: selectedCreature,
            name: creatureName || getNickname(selectedCreature),
            weight: parseFloat(creatureWeight) || creatures[selectedCreature]?.weight || 100,
            maturationPct: (parseFloat(creatureMaturation) || 0) / 100,
            isPlaying: startTracking,
            trackedServerId: isUnofficial ? unofficialIp : (selectedServer?.id || null)
        } : null;

        // Mark onboarding as complete
        localStorage.setItem('onboardingCompleted', 'v2.5');

        // Notify parent
        onComplete(creatureData);
    }, [globalSettings, language, gameVersion, theme, notificationsEnabled, selectedCreature, creatureName, creatureWeight, creatureMaturation, startTracking, onComplete, creatures, isUnofficial, selectedServer, unofficialIp]);

    const handleSkip = useCallback(() => {
        localStorage.setItem('onboardingCompleted', 'v2.5');
        onComplete(null);
    }, [onComplete]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight' || e.key === 'Enter') {
                if (currentStep < STEPS.length - 1) handleNext();
            } else if (e.key === 'ArrowLeft') {
                handleBack();
            } else if (e.key === 'Escape') {
                handleSkip();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentStep, handleBack, handleNext, handleSkip]);

    // Filter creatures for search
    const filteredCreatures = Object.keys(creatures).filter(name =>
        name.toLowerCase().includes(creatureSearch.toLowerCase())
    ).slice(0, 20);

    // Theme names are NOT translated - they are proper names
    const themes = [
        { id: 'arat-prime', name: 'Arat Prime' },
        { id: 'crystal-horizon', name: 'Crystal Horizon' },
        { id: 'aberrant-depths', name: 'Aberrant Depths' },
        { id: 'frozen-peaks', name: 'Frozen Peaks' },
        { id: 'tek-pulse', name: 'Tek Pulse' },
        { id: 'primal-dawn', name: 'Primal Dawn' },
    ];

    const renderStepContent = () => {
        switch (STEPS[currentStep]) {
            case 'welcome':
                return (
                    <div className={styles.stepContent}>
                        <div className={styles.logoContainer}>
                            <img src="/logo.png" alt="ARK Breeding Calculator" className={styles.logoImage} />
                        </div>
                        <h1 className={styles.welcomeTitle}>
                            {t('onboarding.welcome_title', 'Welcome to ARK Breeding Calculator')}
                        </h1>
                        <p className={styles.welcomeSubtitle}>
                            {t('onboarding.welcome_subtitle', "Let's set up your experience in just a few steps.")}
                        </p>
                    </div>
                );

            case 'language':
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>
                            {t('onboarding.language_title', 'Choose Your Language')}
                        </h2>
                        <div className={styles.optionGrid}>
                            <button
                                className={`${styles.optionCard} ${language === 'en' ? styles.active : ''}`}
                                onClick={() => setLanguage('en')}
                            >
                                <span className={styles.optionEmoji}>🇺🇸</span>
                                <span className={styles.optionLabel}>English</span>
                            </button>
                            <button
                                className={`${styles.optionCard} ${language === 'es' ? styles.active : ''}`}
                                onClick={() => setLanguage('es')}
                            >
                                <span className={styles.optionEmoji}>🇪🇸</span>
                                <span className={styles.optionLabel}>Español</span>
                            </button>
                        </div>
                    </div>
                );

            case 'gameVersion':
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>
                            {t('onboarding.game_version_title', 'Select Your Game')}
                        </h2>
                        <p className={styles.stepDescription}>
                            {t('onboarding.game_version_desc', 'Different versions have different breeding mechanics.')}
                        </p>
                        <div className={styles.optionGrid}>
                            <button
                                className={`${styles.optionCard} ${styles.large} ${gameVersion === 'ASE' ? styles.active : ''}`}
                                onClick={() => setGameVersion('ASE')}
                            >
                                <span className={styles.optionTitle}>ASE</span>
                                <span className={styles.optionDesc}>
                                    {t('onboarding.ase_desc', 'Ark Survival Evolved')}
                                </span>
                            </button>
                            <button
                                className={`${styles.optionCard} ${styles.large} ${gameVersion === 'ASA' ? styles.active : ''}`}
                                onClick={() => setGameVersion('ASA')}
                            >
                                <span className={styles.optionTitle}>ASA</span>
                                <span className={styles.optionDesc}>
                                    {t('onboarding.asa_desc', 'Ark Survival Ascended')}
                                </span>
                            </button>
                        </div>
                    </div>
                );
            case 'server':
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>
                            {t('onboarding.server_title', 'Connect Your Server')}
                        </h2>
                        <p className={styles.stepDescription}>
                            {t('onboarding.server_desc', 'Track server status and get automatic growth adjustments during downtime.')}
                        </p>

                        <div className={styles.serverTabs}>
                            <button
                                className={`${styles.tab} ${!isUnofficial ? styles.active : ''} ${gameVersion === 'ASE' ? styles.disabled : ''}`}
                                onClick={() => gameVersion === 'ASA' && setIsUnofficial(false)}
                                disabled={gameVersion === 'ASE'}
                            >
                                Official (ASA)
                            </button>
                            <button
                                className={`${styles.tab} ${isUnofficial ? styles.active : ''}`}
                                onClick={() => setIsUnofficial(true)}
                            >
                                Unofficial / Private
                            </button>
                        </div>

                        {!isUnofficial ? (
                            <div className={styles.searchContainer}>
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Search Official Server (Name or ID)..."
                                    value={serverSearch}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setServerSearch(val);
                                        if (!val) setServerResults([]);
                                    }}
                                />
                                {serverResults.length > 0 && (
                                    <div className={styles.serverList}>
                                        {serverResults.map(s => (
                                            <button
                                                key={s.id}
                                                className={`${styles.serverItem} ${selectedServer?.id === s.id ? styles.active : ''}`}
                                                onClick={() => {
                                                    setSelectedServer(s);
                                                    setServerSearch('');
                                                }}
                                            >
                                                <span className={styles.serverName}>{s.name}</span>
                                                <span className={styles.serverMeta}>{s.map} • {s.players}/{s.max_players}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedServer && !serverSearch && (
                                    <div className={styles.selectedBadge}>
                                        Connected to: <strong>{selectedServer.name}</strong>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className={styles.ipContainer}>
                                <input
                                    type="text"
                                    className={styles.searchInput}
                                    placeholder="Server IP:Port (e.g., 12.34.56.78:27015)"
                                    value={unofficialIp}
                                    onChange={(e) => setUnofficialIp(e.target.value)}
                                />
                            </div>
                        )}

                        <div className={styles.skipHint}>
                            You can skip this and configure it later in dashboard settings.
                        </div>
                    </div>
                );

            case 'theme':
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>
                            {t('onboarding.theme_title', 'Choose Your Atmosphere')}
                        </h2>
                        <div className={styles.themeGrid}>
                            {themes.map(t => (
                                <button
                                    key={t.id}
                                    className={`${styles.themeCard} ${theme === t.id ? styles.active : ''}`}
                                    onClick={() => setTheme(t.id)}
                                    data-theme={t.id}
                                >
                                    <div className={styles.themePreview} />
                                    <span className={styles.themeName}>{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>
                            {t('onboarding.notifications_title', 'Stay Informed')}
                        </h2>
                        <p className={styles.stepDescription}>
                            {t('onboarding.notifications_desc', 'Get alerts when your creatures need attention.')}
                        </p>
                        <div className={styles.notificationToggle}>
                            <button
                                className={`${styles.toggleOption} ${notificationsEnabled ? styles.active : ''}`}
                                onClick={() => setNotificationsEnabled(true)}
                            >
                                <span className={styles.toggleEmoji}>🔔</span>
                                <span>{t('onboarding.notifications_on', 'Enable Notifications')}</span>
                            </button>
                            <button
                                className={`${styles.toggleOption} ${!notificationsEnabled ? styles.active : ''}`}
                                onClick={() => setNotificationsEnabled(false)}
                            >
                                <span className={styles.toggleEmoji}>🔕</span>
                                <span>{t('onboarding.notifications_off', 'Maybe Later')}</span>
                            </button>
                        </div>
                    </div>
                );

            case 'creature':
                return (
                    <div className={styles.stepContent}>
                        <h2 className={styles.stepTitle}>
                            {t('onboarding.creature_title', 'Add Your First Creature')}
                        </h2>
                        <p className={styles.stepDescription}>
                            {t('onboarding.creature_desc', 'Start tracking a baby to see the calculator in action.')}
                        </p>

                        <div className={styles.creatureForm}>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder={t('ui.search_creatures', 'Search creatures...')}
                                value={creatureSearch}
                                onChange={(e) => setCreatureSearch(e.target.value)}
                                onFocus={(e) => e.target.select()}
                            />

                            {creatureSearch && (
                                <div className={styles.creatureList}>
                                    {filteredCreatures.map(name => (
                                        <button
                                            key={name}
                                            className={`${styles.creatureItem} ${selectedCreature === name ? styles.active : ''}`}
                                            onClick={() => {
                                                setSelectedCreature(name);
                                                setCreatureName('');
                                                setCreatureSearch('');
                                            }}
                                        >
                                            <img
                                                src={getCreatureIcon(name)}
                                                alt=""
                                                className={styles.creatureIcon}
                                                onError={(e) => e.target.style.display = 'none'}
                                            />
                                            {name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {selectedCreature && (
                                <div className={styles.selectedCreature}>
                                    <div className={styles.creatureDisplay}>
                                        <img
                                            src={getCreatureIcon(selectedCreature)}
                                            alt={selectedCreature}
                                            className={styles.selectedCreatureIcon}
                                        />
                                        <div>
                                            <div className={styles.creatureSelected}>{getNickname(selectedCreature)}</div>
                                            <div className={styles.creatureType}>{selectedCreature}</div>
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        className={styles.nameInput}
                                        placeholder={t('ui.name', 'Nombre')}
                                        value={creatureName}
                                        onChange={(e) => setCreatureName(e.target.value)}
                                        onFocus={(e) => e.target.select()}
                                    />

                                    <div className={styles.statsRow}>
                                        <div className={styles.statInput}>
                                            <label>{t('fields.weight', 'Weight')}</label>
                                            <input
                                                type="number"
                                                className={styles.numberInput}
                                                placeholder={creatures[selectedCreature]?.weight || '100'}
                                                value={creatureWeight}
                                                onChange={(e) => setCreatureWeight(e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>
                                        <div className={styles.statInput}>
                                            <label>{t('fields.maturation_pct', 'Maturation %')}</label>
                                            <input
                                                type="number"
                                                className={styles.numberInput}
                                                placeholder="0"
                                                min="0"
                                                max="100"
                                                value={creatureMaturation}
                                                onChange={(e) => {
                                                    let val = e.target.value;
                                                    if (parseFloat(val) > 100) val = '100';
                                                    setCreatureMaturation(val);
                                                }}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>
                                    </div>

                                    <label
                                        className={styles.trackingLabel}
                                        title={t('tooltips.start_tracking_desc', 'Automatically increment maturation based on species growth rate')}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={startTracking}
                                            onChange={(e) => setStartTracking(e.target.checked)}
                                        />
                                        <span>{t('ui.start_tracking', 'Start Tracking')}</span>
                                    </label>
                                </div>
                            )}

                            <p className={styles.skipHint}>
                                {t('onboarding.skip_creature', 'You can skip this and add creatures later.')}
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.wizard}>
                {/* Progress indicator */}
                <div className={styles.progress}>
                    {STEPS.map((step, index) => (
                        <div
                            key={step}
                            className={`${styles.dot} ${index === currentStep ? styles.active : ''} ${index < currentStep ? styles.completed : ''}`}
                        />
                    ))}
                </div>

                {/* Step content */}
                <div className={styles.content}>
                    {renderStepContent()}
                </div>

                {/* Navigation */}
                <div className={styles.navigation}>
                    {currentStep > 0 ? (
                        <button className={styles.backBtn} onClick={handleBack}>
                            {t('onboarding.back', '← Back')}
                        </button>
                    ) : (
                        <button className={styles.skipBtn} onClick={handleSkip}>
                            {t('onboarding.skip', 'Skip Setup')}
                        </button>
                    )}

                    {currentStep < STEPS.length - 1 ? (
                        <button className={styles.nextBtn} onClick={handleNext}>
                            {t('onboarding.next', 'Next →')}
                        </button>
                    ) : (
                        <button className={styles.completeBtn} onClick={handleComplete}>
                            {t('onboarding.complete', 'Get Started')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

OnboardingWizard.propTypes = {
    creatures: PropTypes.object.isRequired,
    globalSettings: PropTypes.shape({
        language: PropTypes.string,
        setLanguage: PropTypes.func,
        gameVersion: PropTypes.string,
        setGameVersion: PropTypes.func,
        activeTheme: PropTypes.string,
        setActiveTheme: PropTypes.func,
        onToggleNotify: PropTypes.func
    }).isRequired,
    onComplete: PropTypes.func.isRequired
};
