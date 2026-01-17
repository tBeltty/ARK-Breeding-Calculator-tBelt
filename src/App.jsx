import { useState, useEffect, useMemo, useCallback } from 'react';
import './styles/tokens.css';
import './styles/globals.css';
import './i18n';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

import { CreatureSelector } from './components/CreatureSelector';
import { DataPanel, DataRow, DataInput, LabelWithTooltip } from './components/DataPanel';
import { TroughCalculator } from './components/TroughCalculator';

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
  const [maturationProgress, setMaturationProgress] = useState(initialSession.maturationProgress);
  const [selectedFood, setSelectedFood] = useState(initialSession.selectedFood);
  const [settings, setSettings] = useState(loadSettings);

  // New State for Polish features
  const [gameVersion, setGameVersion] = useState(initialSession.gameVersion || 'ASA');
  const [activeTheme, setActiveTheme] = useState(initialSession.theme || 'atmos-dark');
  const [language, setLanguage] = useState(initialSession.language || 'en');

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
  }, [activeTheme]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);

  // Update food when creature changes (only if current food is incompatible)
  useEffect(() => {
    const newFoods = foodLists[creature?.type] || foodLists['Carnivore'];
    if (!newFoods.includes(selectedFood)) {
      setSelectedFood(newFoods[0]);
    }
  }, [selectedCreature, creature]);

  // Handle creature change - update weight to creature default
  const handleCreatureChange = useCallback((newCreature) => {
    setSelectedCreature(newCreature);
    const creatureData = creatures[newCreature];
    if (creatureData) {
      setWeight(creatureData.weight);
      setMaturationProgress(0); // Reset maturation when changing creature
    }
  }, []);

  // Persist settings via Infrastructure layer
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Persist session state
  useEffect(() => {
    saveSession({
      selectedCreature,
      weight,
      maturationProgress,
      selectedFood,
      gameVersion,
      theme: activeTheme,
      language
    });
  }, [selectedCreature, weight, maturationProgress, selectedFood, gameVersion, activeTheme, language]);

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
            <h1 className={styles.title}>{t('title')}</h1>
            <p className={styles.subtitle}>v2.1 • {t('ui.version_edition', { version: gameVersion })}</p>
          </div>

          <div className={styles.quickSettings}>
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
              <option value="atmos-dark">{t('ui.themes.atmos-dark')}</option>
              <option value="atmos-light">{t('ui.themes.atmos-light')}</option>
              <option value="tek-pulse">{t('ui.themes.tek-pulse')}</option>
              <option value="primal-dawn">{t('ui.themes.primal-dawn')}</option>
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
              value={calculations.foodCapacity.toLocaleString()}
            />
            <DataRow
              label={t('fields.food_rate')}
              tooltip={t('tooltips.food_rate')}
              value={t('ui.food_rate_value', { rate: calculations.currentFoodRate.toFixed(2) })}
            />
          </DataPanel>

          <TroughCalculator
            creatures={creatures}
            foods={foods}
            foodLists={foodLists}
            settings={settings}
            currentCreature={selectedCreature}
            currentMaturation={maturationProgress}
          />
        </main>

        <footer className={styles.footer}>
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
