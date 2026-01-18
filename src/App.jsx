import { useState, useEffect, useMemo, useCallback } from 'react';
import './styles/tokens.css';
import './styles/globals.css';
import './i18n';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

import { CreatureSelector } from './components/CreatureSelector';
import { DataPanel, DataRow, DataInput, LabelWithTooltip } from './components/DataPanel';
import { TroughCalculator } from './components/TroughCalculator';
import { SettingsMenu } from './components/SettingsMenu';
import { NotificationManager } from './infrastructure/NotificationManager';

import { Modal } from './components/Modal';

// Domain - only formatTime needed for presentation
import { formatTime } from './domain/breeding';

// Application - Use Case for business logic
import { calculateBreedingStats } from './application/usecases';

// Infrastructure - Storage adapter
import { loadSettings, saveSettings, loadSession, saveSession } from './infrastructure/LocalStorageSettingsRepository';

// Data
import creatures from './data/creatures.json';
import foods from './data/foods.json';
import foodLists from './data/foodLists.json';

import styles from './App.module.css';

export default function App() {
  const { t } = useTranslation();

  // Load initial state from session
  const initialSession = loadSession();

  const [selectedCreature, setSelectedCreature] = useState(initialSession.selectedCreature);
  const [weight, setWeight] = useState(initialSession.weight);
  const [maxFood, setMaxFood] = useState(initialSession.maxFood || 0);
  const [maturationProgress, setMaturationProgress] = useState(initialSession.maturationProgress);
  const [selectedFood, setSelectedFood] = useState(initialSession.selectedFood);
  const [settings, setSettings] = useState(loadSettings);

  // New State for Polish features
  const [gameVersion, setGameVersion] = useState(initialSession.gameVersion || 'ASA');

  // Valid themes list - used for validation
  const validThemes = ['arat-prime', 'tek-pulse', 'primal-dawn', 'aberrant-depths', 'frozen-peaks', 'crystal-horizon'];
  const savedTheme = initialSession.theme || 'arat-prime';
  const initialTheme = validThemes.includes(savedTheme) ? savedTheme : 'arat-prime';


  const [activeTheme, setActiveTheme] = useState(initialTheme);
  const [language, setLanguage] = useState(initialSession.language || 'en');

  // UI States
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false); // New Modal State

  // Global Settings State (Lifted from TroughCalculator)
  const [advancedMode, setAdvancedMode] = useState(initialSession.advancedMode || false);
  const [useStasisMode, setUseStasisMode] = useState(initialSession.useStasisMode || false);
  const [notifyEnabled, setNotifyEnabled] = useState(initialSession.notifyEnabled || false);
  const [notifyTime, setNotifyTime] = useState(initialSession.notifyTime || 10);

  const [panelStates, setPanelStates] = useState({
    creature: true,
    maturation: true,
    baby: true,
    food: true,
    settings: false
  });

  const creature = creatures[selectedCreature];
  const foodType = creature?.type || 'Carnivore';
  const availableFoods = foodLists[foodType] || foodLists['Carnivore'];

  // Apply Theme & Language
  useEffect(() => {
    document.body.className = `theme-${activeTheme}`;

    // Dynamic Background per Theme
    const themeBackgrounds = {
      'arat-prime': 'aratprime.png',
      'tek-pulse': 'tekpulse.png',
      'primal-dawn': 'primaldawn.png',
      'aberrant-depths': 'aberrantdepths.png',
      'frozen-peaks': 'ash.png',
      'crystal-horizon': 'crystal.png'
    };
    const bgImage = themeBackgrounds[activeTheme] || 'aratprime.png';

    // Set CSS variable for background image
    document.documentElement.style.setProperty('--bg-image', `url('/${bgImage}')`);
  }, [activeTheme]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // Update max food default when weight changes if needed, or just let user override
  // Current logic: we don't auto-calc max food in state, we let UseCase handle it unless overriden.
  // But for the input, we start at 0 (auto) or saved value.

  // Update food when creature changes (only if current food is incompatible)
  useEffect(() => {
    const newFoods = foodLists[creature?.type] || foodLists['Carnivore'];
    if (!newFoods.includes(selectedFood)) {
      // eslint-disable-next-line
      setSelectedFood(newFoods[0]);
    }
  }, [selectedCreature, creature, selectedFood]);

  // Handle creature change - update weight to creature default
  const handleCreatureChange = useCallback((newCreature) => {
    setSelectedCreature(newCreature);
    const creatureData = creatures[newCreature];
    if (creatureData) {
      setWeight(creatureData.weight);
      setMaturationProgress(0); // Reset maturation when changing creature
      setMaxFood(0); // Reset max food override
    }
  }, []);

  // Handle Notification Toggle
  const handleNotifyToggle = async () => {
    if (!notifyEnabled) {
      const granted = await NotificationManager.requestPermission();
      if (granted) {
        setNotifyEnabled(true);
      } else {
        alert(t('notifications.perm_denied'));
      }
    } else {
      setNotifyEnabled(false);
    }
  };

  // Persist settings via Infrastructure layer
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Persist session state
  useEffect(() => {
    saveSession({
      selectedCreature,
      weight,
      maxFood,
      maturationProgress,
      selectedFood,
      gameVersion,
      theme: activeTheme,
      language,
      advancedMode,
      useStasisMode,
      notifyEnabled,
      notifyTime
    });
  }, [
    selectedCreature, weight, maxFood, maturationProgress, selectedFood,
    gameVersion, activeTheme, language,
    advancedMode, useStasisMode, notifyEnabled, notifyTime
  ]);

  // Use Application layer Use Case for calculations
  const calculations = useMemo(() => {
    if (!creature) return null;

    const food = foods[selectedFood];
    if (!food) return null;

    try {
      return calculateBreedingStats({
        creature,
        food,
        weight,
        maturationProgress,
        settings
      });
    } catch (error) {
      console.error('Calculation error:', error);
      return null;
    }
  }, [creature, settings, maturationProgress, weight, selectedFood]);

  const togglePanel = (panel) => {
    setPanelStates(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!creature || !calculations) {
    return <div className={styles.loading}>{t('ui.loading')}</div>;
  }

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerMain}>
            <img src="/logo.png?v=3" alt="ARK Breeding Calculator" className={styles.logo} />
            <div className={styles.headerText}>
              <h1 className={styles.title}>{t('title')}</h1>
              <p className={styles.subtitle}>v2.1 • {t('ui.version_edition', { version: gameVersion })}</p>
            </div>
          </div>

          <div className={styles.quickSettings}>
            <SettingsMenu
              advancedMode={advancedMode}
              onToggleAdvanced={setAdvancedMode}
              notifyEnabled={notifyEnabled}
              onToggleNotify={handleNotifyToggle}
              notifyTime={notifyTime}
              onNotifyTimeChange={setNotifyTime}
              useStasisMode={useStasisMode}
              onToggleStasisMode={setUseStasisMode}
            />

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={styles.miniSelect}
              title={t('ui.languages_title')}
            >
              <option value="en">{t('ui.languages.en')}</option>
              <option value="es">{t('ui.languages.es')}</option>
            </select>

            <select
              value={activeTheme}
              onChange={(e) => setActiveTheme(e.target.value)}
              className={styles.miniSelect}
              title={t('ui.theme')}
            >
              <option value="arat-prime">Arat Prime</option>
              <option value="crystal-horizon">Crystal Horizon</option>
              <option value="aberrant-depths">Aberrant Depths</option>
              <option value="frozen-peaks">Frozen Peaks</option>
              <option value="tek-pulse">Tek Pulse</option>
              <option value="primal-dawn">Primal Dawn</option>
            </select>

            <button
              className={`${styles.versionBtn} ${gameVersion === 'ASA' ? styles.active : ''}`}
              onClick={() => setGameVersion(gameVersion === 'ASA' ? 'ASE' : 'ASA')}
              title={t('tooltips.game_version')}
            >
              {gameVersion}
            </button>
          </div>
        </header>

        <main className={styles.main}>
          <DataPanel
            title={t('panels.creature')}
            isOpen={panelStates.creature}
            onToggle={() => togglePanel('creature')}
          >
            <CreatureSelector
              creatures={creatures}
              selectedCreature={selectedCreature}
              onSelect={handleCreatureChange}
            />
            <DataInput
              label={t('fields.weight')}
              tooltip={t('tooltips.weight')}
              value={weight}
              onChange={setWeight}
              min={1}
              max={10000}
            />

            {/* Max Food Input - Only in Advanced Mode */}
            {advancedMode && (
              <DataInput
                label={t('fields.max_food')}
                tooltip={t('tooltips.max_food')}
                value={maxFood}
                onChange={setMaxFood}
                min={0}
                max={1000000}
                placeholder={t('ui.auto_calculated')}
                step={10}
              />
            )}

            <div className={styles.foodSelect}>
              <LabelWithTooltip
                label={t('fields.selected_food')}
                tooltip={t('tooltips.selected_food')}
                className={styles.label}
              />
              <select
                value={selectedFood}
                onChange={(e) => setSelectedFood(e.target.value)}
                className={styles.select}
                title={t('tooltips.selected_food')}
              >
                {availableFoods.map(food => (
                  <option key={food} value={food}>{food}</option>
                ))}
              </select>
            </div>
          </DataPanel>

          <DataPanel
            title={t('panels.settings')}
            isOpen={panelStates.settings}
            onToggle={() => togglePanel('settings')}
          >
            <DataInput
              label={t('fields.hatch_speed')}
              tooltip={t('tooltips.hatch_speed')}
              value={settings.hatchSpeed}
              onChange={(v) => updateSetting('hatchSpeed', v)}
              min={0.1}
              step={0.1}
            />
            <DataInput
              label={t('fields.maturation_speed')}
              tooltip={t('tooltips.maturation_speed')}
              value={settings.maturationSpeed}
              onChange={(v) => updateSetting('maturationSpeed', v)}
              min={0.1}
              step={0.1}
            />
            <DataInput
              label={t('fields.consumption_speed')}
              tooltip={t('tooltips.consumption_speed')}
              value={settings.consumptionSpeed}
              onChange={(v) => updateSetting('consumptionSpeed', v)}
              min={0.1}
              step={0.1}
            />

            {gameVersion === 'ASE' && (
              <>
                <DataInput
                  label={t('fields.gen2_hatch')}
                  tooltip={t('tooltips.gen2_hatch')}
                  value={settings.gen2HatchEffect}
                  onChange={(v) => updateSetting('gen2HatchEffect', v)}
                  type="checkbox"
                />
                <DataInput
                  label={t('fields.gen2_growth')}
                  tooltip={t('tooltips.gen2_growth')}
                  value={settings.gen2GrowthEffect}
                  onChange={(v) => updateSetting('gen2GrowthEffect', v)}
                  type="checkbox"
                />
              </>
            )}
          </DataPanel>

          <DataPanel
            title={t('panels.maturation')}
            isOpen={panelStates.maturation}
            onToggle={() => togglePanel('maturation')}
          >
            <DataRow
              label={t(`birth_types.${calculations.birthLabel}`)}
              tooltip={t('tooltips.birth_time')}
              value={formatTime(calculations.birthTime)}
            />
            <DataInput
              label={t('fields.maturation_pct')}
              tooltip={t('tooltips.maturation_pct')}
              value={Number((maturationProgress * 100).toFixed(1))}
              onChange={(v) => setMaturationProgress(Math.min(100, Math.max(0, v)) / 100)}
              min={0}
              max={100}
              step={0.1}
              decimals={1}
              suffix="%"
            />
            <DataRow
              label={t('fields.elapsed_time')}
              tooltip={t('tooltips.elapsed_time')}
              value={formatTime(calculations.maturationTimeComplete)}
            />
            <DataRow
              label={t('fields.time_to_juvenile')}
              tooltip={t('tooltips.time_to_juvenile')}
              value={formatTime(calculations.babyTimeRemaining)}
            />
            <DataRow
              label={t('fields.time_to_adult')}
              tooltip={t('tooltips.time_to_adult')}
              value={formatTime(calculations.maturationTimeRemaining)}
            />
          </DataPanel>

          <DataPanel
            title={t('panels.baby')}
            isOpen={panelStates.baby}
            onToggle={() => togglePanel('baby')}
          >
            <DataRow
              label={t('fields.hand_feed_for')}
              tooltip={t('tooltips.hand_feed')}
              highlight={true}
              value={
                maturationProgress * 100 >= calculations.handFeedUntil
                  ? t('ui.done')
                  : t('ui.more', {
                    pct: (calculations.handFeedUntil - maturationProgress * 100).toFixed(1),
                    time: formatTime(calculations.handFeedTime - calculations.maturationTimeComplete)
                  })
              }
            />
            <DataRow
              label={t('fields.current_buffer')}
              tooltip={t('tooltips.current_buffer')}
              highlight={true}
              value={formatTime(calculations.currentBuffer)}
            />
            <DataRow
              label={t('fields.food_capacity')}
              tooltip={t('tooltips.food_capacity', { food: selectedFood })}
              value={maxFood > 0 ? `${maxFood.toLocaleString()} (Custom)` : calculations.foodCapacity.toLocaleString()}
            />
            <DataRow
              label={t('fields.food_rate')}
              tooltip={t('tooltips.food_rate')}
              value={t('ui.food_rate_value', { rate: calculations.currentFoodRate.toFixed(2) })}
            />
            <DataRow
              label={t('fields.food_to_adult')}
              tooltip={t('tooltips.food_to_adult')}
              value={calculations.toAdultFoodItems.toLocaleString()}
            />

            {/* Food Breakdown Button */}
            <div style={{ marginTop: '12px', textAlign: 'center' }}>
              <button
                style={{
                  background: 'rgb(var(--primary) / 0.15)',
                  color: 'rgb(var(--primary))',
                  border: '1px solid rgb(var(--primary) / 0.3)',
                  padding: '6px 16px',
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onClick={() => setIsBreakdownOpen(true)}
              >
                📊 {t('ui.view_breakdown')}
              </button>
            </div>
          </DataPanel>

          {/* Breakdown Modal */}
          {isBreakdownOpen && calculations?.dailyFood && (
            <Modal
              isOpen={isBreakdownOpen}
              onClose={() => setIsBreakdownOpen(false)}
              title={t('ui.breakdown_daily_title')}
            >
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '60vh',
                overflowY: 'auto'
              }}>
                {Object.entries(calculations.dailyFood).map(([day, amount]) => (
                  <div key={day} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgb(var(--surface-container-high) / 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem'
                  }}>
                    <span style={{ opacity: 0.9 }}>{t('ui.day')} {day}</span>
                    <strong style={{ color: 'rgb(var(--primary))' }}>{amount.toLocaleString()}</strong>
                  </div>
                ))}
                {Object.keys(calculations.dailyFood).length === 0 && (
                  <p style={{ opacity: 0.6, fontStyle: 'italic' }}>{t('ui.no_data_available')}</p>
                )}
              </div>
            </Modal>
          )}

          <TroughCalculator
            creatures={creatures}
            foods={foods}
            foodLists={foodLists}
            settings={settings}
            currentCreature={selectedCreature}
            currentMaturation={maturationProgress}
            currentMaxFood={maxFood > 0 ? maxFood : null}
            gameVersion={gameVersion}

            // Global Settings Props
            advancedMode={advancedMode}
            useStasisMode={useStasisMode}
            notifyEnabled={notifyEnabled}
            notifyTime={notifyTime}
          />
        </main>

        <footer className={styles.footer}>
          <a href="https://github.com/tBeltty/ARK-Breeding-Calculator-tBelt" target="_blank" rel="noopener noreferrer">
            {t('ui.remake_credit')}
          </a>
          {' • '}
          <a href="https://github.com/Crumplecorn/ARK-Breeding-Calculator" target="_blank" rel="noopener noreferrer">
            {t('ui.author_credit')}
          </a>
          {' • '}
          <span>{t('ui.theme')}: {t(`ui.themes.${activeTheme}`)}</span>
        </footer>
      </div>
    </div>
  );
}
