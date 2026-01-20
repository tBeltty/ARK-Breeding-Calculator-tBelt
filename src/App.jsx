import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { useToast } from './components/Toast';

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

  // Refs for Notification Logic
  const notificationTimeoutRef = useRef(null);
  const lastAlertTimeRef = useRef(0);

  // Global Settings State (Lifted from TroughCalculator)
  const [advancedMode, setAdvancedMode] = useState(initialSession.advancedMode || false);
  const [useStasisMode, setUseStasisMode] = useState(initialSession.useStasisMode || false);
  const [notifyEnabled, setNotifyEnabled] = useState(initialSession.notifyEnabled || false);
  const [notifyTime, setNotifyTime] = useState(initialSession.notifyTime || 10);

  // Phase 1 New State
  const [desiredBuffer, setDesiredBuffer] = useState(60);
  const [desiredBufferUnit, setDesiredBufferUnit] = useState('m'); // 'm' or 'h'
  const [notifyBufferTime, setNotifyBufferTime] = useState(5); // minutes before empty

  const { addToast, ToastContainer } = useToast();

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
        addToast(t('messages.notification_enabled', 'Notifications Enabled'), 'success');
      } else {
        addToast(t('notifications.perm_denied'), 'error');
      }
    } else {
      setNotifyEnabled(false);
      addToast(t('messages.notification_disabled', 'Notifications Disabled'), 'info');
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

  // Phase 1: Calculate Maturation Needed for Desired Buffer
  // Formula: Buffer = (Capacity * FoodValue) / Rate
  // Capacity = (Weight * Maturation * 0.1 ?) No, Capacity = Weight * Maturation / FoodWeight
  // So: Buffer = ((Weight * Maturation / FoodWeight) * FoodValue) / Rate
  // Solve for Maturation:
  // Maturation = (Buffer * Rate * FoodWeight) / (Weight * FoodValue)
  const maturationNeededForBuffer = useMemo(() => {
    if (!calculations || !weight || !creature) return 0;

    // Safety: rate is per minute, buffer is in minutes.
    // calculations.currentFoodRate is per minute.

    const food = foods[selectedFood];
    if (!food) return 0;

    const rate = calculations.currentFoodRate; // per minute
    if (rate <= 0) return 0;

    // Convert input to minutes based on unit
    const bufferInMinutes = desiredBufferUnit === 'h' ? desiredBuffer * 60 : desiredBuffer;

    const neededCapacityValues = (bufferInMinutes * rate); // Food points needed
    const neededSlots = neededCapacityValues / food.food;
    const neededWeight = neededSlots * food.weight;

    const neededMaturation = neededWeight / weight;
    return Math.min(100, Math.max(0, neededMaturation * 100)); // Percentage 0-100
  }, [calculations, desiredBuffer, desiredBufferUnit, weight, selectedFood, creature]);


  // Phase 1: Manual Buffer Notification State
  const [bufferLeadTime, setBufferLeadTime] = useState(10); // Default 10 mins lead time

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
              tooltip={t('tooltips.hand_feed_extended', { pct: calculations.totalHandFeedPct.toFixed(1) })}
              highlight={true}
              value={
                maturationProgress * 100 >= calculations.totalHandFeedPct
                  ? t('ui.done')
                  : t('ui.hand_feed_remaining', {
                    pct: (calculations.totalHandFeedPct - maturationProgress * 100).toFixed(1)
                  })
              }
            />
            <DataRow
              label={t('fields.current_buffer')}
              tooltip={t('tooltips.current_buffer')}
              highlight={true}
              value={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{formatTime(calculations.currentBuffer)}</span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
                    {/* Buffer Lead Time Input */}
                    <input
                      type="number"
                      value={bufferLeadTime === '' ? '' : bufferLeadTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBufferLeadTime(val === '' ? '' : Number(val));
                      }}
                      onClick={(e) => e.target.select()} // Auto-select on click
                      placeholder="10"
                      style={{
                        width: '40px',
                        textAlign: 'center',
                        background: 'rgba(0,0,0,0.2)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        padding: '2px',
                        fontSize: '0.8rem',
                        color: 'inherit'
                      }}
                      title={t('tooltips.notify_lead_time')}
                    />
                    <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>m</span>

                    <button
                      onClick={() => {
                        // Use default if empty
                        const time = bufferLeadTime === '' ? 10 : bufferLeadTime;

                        // Calculate actual delay: Buffer Duration - LeadTime
                        // currentBuffer is in seconds
                        const delaySeconds = calculations.currentBuffer - (time * 60);

                        if (delaySeconds <= 0) {
                          addToast(t('messages.too_soon_for_notification'), 'warning');
                          return;
                        }

                        const delayMs = delaySeconds * 1000;
                        const id = NotificationManager.schedule(
                          'buffer-alert',
                          t('notifications.title_depleted'),
                          t('notifications.body_depleted', { creature: creature.name || 'Creature' }),
                          delayMs
                        );

                        if (id) {
                          addToast(t('ui.notification_set_lead', { time: formatTime(calculations.currentBuffer), lead: bufferLeadTime }), 'success');
                        } else {
                          NotificationManager.requestPermission().then(granted => {
                            if (granted) {
                              addToast(t('permissions.granted_retry', 'Permission granted. Try again.'), 'info');
                            } else {
                              addToast(t('notifications.perm_denied'), 'error');
                            }
                          });
                        }
                      }}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--outline)',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        padding: '2px 6px',
                        color: 'var(--primary)',
                        marginLeft: '4px'
                      }}
                      title={t('ui.set_notification')}
                    >
                      🔔
                    </button>
                  </div>
                </div>
              }
            />

            {/* Phase 1: Desired Buffer Input */}
            <div className={styles.inputGroup} style={{ marginBottom: '8px', display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <DataInput
                  label={t('fields.desired_buffer')}
                  value={desiredBuffer}
                  onChange={setDesiredBuffer}
                  min={1}
                  hideLabel={false}
                />
              </div>
              <select
                value={desiredBufferUnit}
                onChange={(e) => setDesiredBufferUnit(e.target.value)}
                className={styles.miniSelect}
                style={{
                  marginLeft: '8px',
                  padding: '4px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgb(var(--surface-container-high))',
                  border: '1px solid rgb(var(--outline) / 0.3)',
                  marginBottom: '4px' // Align with input
                }}
              >
                <option value="m">{t('ui.minutes_short') || 'min'}</option>
                <option value="h">{t('ui.hours_short') || 'h'}</option>
              </select>
            </div>
            {/* Display Maturation Needed for this buffer */}
            <DataRow
              label={t('fields.maturation_needed')}
              tooltip={t('tooltips.maturation_needed')}
              value={
                <span>
                  {maturationNeededForBuffer.toFixed(2)}%
                  <span style={{ fontSize: '0.8em', opacity: 0.7, marginLeft: '6px' }}>
                    ({maturationProgress * 100 < maturationNeededForBuffer ? '+' : ''}
                    {(maturationNeededForBuffer - maturationProgress * 100).toFixed(2)}%)
                  </span>
                </span>
              }
            />

            {/* Phase 1: Notify Buffer Time */}
            <DataInput
              label={t('fields.notify_buffer_time')}
              value={notifyBufferTime}
              onChange={setNotifyBufferTime}
              min={1}
              max={60}
              suffix="m"
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

            {/* Phase 1: Food to Juvenile */}
            <DataRow
              label={t('fields.food_to_juvenile')}
              value={
                calculations.toJuvFoodItems > 0
                  ? calculations.toJuvFoodItems.toLocaleString()
                  : t('ui.ready')
              }
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
            onToast={addToast}
          />
        </main>

        <ToastContainer />

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
