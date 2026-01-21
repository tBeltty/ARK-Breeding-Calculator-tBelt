import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { getNickname } from '../../utils/nicknames';
import { getCreatureIcon } from '../../utils/creatureIcons';
import styles from './OnboardingWizard.module.css';

const STEPS = ['welcome', 'language', 'gameVersion', 'theme', 'notifications', 'creature'];

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

    // Creature creation state
    const [selectedCreature, setSelectedCreature] = useState('');
    const [creatureName, setCreatureName] = useState('');
    const [creatureWeight, setCreatureWeight] = useState('');
    const [creatureMaturation, setCreatureMaturation] = useState('0');
    const [startTracking, setStartTracking] = useState(true);
    const [creatureSearch, setCreatureSearch] = useState('');

    // Apply language changes in real-time for preview
    useEffect(() => {
        i18n.changeLanguage(language);
    }, [language, i18n]);

    // Apply theme changes in real-time for preview
    useEffect(() => {
        document.body.className = `theme-${theme}`;
    }, [theme]);

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
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
            maturationPct: parseFloat(creatureMaturation) || 0,
            isPlaying: startTracking
        } : null;

        // Mark onboarding as complete
        localStorage.setItem('onboardingCompleted', 'v2.5');

        // Notify parent
        onComplete(creatureData);
    };

    const handleSkip = () => {
        localStorage.setItem('onboardingCompleted', 'v2.5');
        onComplete(null);
    };

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
    }, [currentStep]);

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
                                        onClick={(e) => e.target.select()}
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
                                                onClick={(e) => e.target.select()}
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
                                                onChange={(e) => setCreatureMaturation(e.target.value)}
                                                onClick={(e) => e.target.select()}
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
