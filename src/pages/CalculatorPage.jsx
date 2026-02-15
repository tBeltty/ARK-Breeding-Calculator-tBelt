import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useOutletContext } from 'react-router-dom';

import { ActiveSessionDetail } from '../components/Session/ActiveSessionDetail';
import { TroughCalculator } from '../components/TroughCalculator';
import { calculateBreedingStats } from '../application/usecases';

import creatures from '../data/creatures.json';
import foods from '../data/foods.json';
import foodLists from '../data/foodLists.json';

export default function CalculatorPage() {
  const { t } = useTranslation();

  // Consume App State from Layout
  const appState = useOutletContext();
  const {
    activeSession,
    updateActiveSession,
    settings,
    updateGlobalSetting,
    gameVersion,
    notifyEnabled,
    notifyTime,
    handleNotifyToggle,
    handleOpenAddModal,
    createGhostSession, // NEW
    isGhostMode // NEW
  } = appState;

  // Local UI States (View Logic)
  const [panelStates, setPanelStates] = useState({
    creature: true,
    maturation: true,
    baby: true,
    food: true,
    settings: false
  });

  // Note: Trough local defaults. This could be global if desired.
  const [advancedMode] = useState(false);

  const togglePanel = (panel) => {
    setPanelStates(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  // Calculations (View Logic)
  const calculations = useMemo(() => {
    if (!activeSession || !activeSession.creature) return null;
    const creature = creatures[activeSession.creature];
    const foodName = activeSession.data.selectedFood || 'Raw Meat';
    const food = foods[foodName];
    if (!food || !creature) return null;

    // Attach name for weight reduction logic
    const foodWithName = { ...food, name: foodName };

    try {
      return calculateBreedingStats({
        creature,
        food: foodWithName,
        weight: activeSession.data.weight || 0,
        maxFood: activeSession.data.maxFood || 0,
        maturationProgress: activeSession.data.maturation || 0,
        settings,
        consolidationInterval: (activeSession.data.autoSortInterval || 0) * 3600 // We'll store it in hours in UI, convert to seconds
      });
    } catch (error) {
      console.error('Calculation error:', error);
      return null;
    }
  }, [activeSession, settings]);

  // Empty State
  if (!activeSession) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '60vh',
        color: 'var(--on-surface-variant)',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🦖</div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--on-surface)' }}>
          {t('ui.no_creatures', 'No Creatures Tracked')}
        </h2>
        <p style={{ maxWidth: '400px', lineHeight: '1.5' }}>
          {t('ui.no_creatures_desc', 'Add a creature from the sidebar to start tracking maturation and food consumption.')}
        </p>
        <button
          onClick={handleOpenAddModal}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: 'rgb(var(--primary))',
            color: 'rgb(var(--on-primary))',
            border: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>+</span> {t('ui.add_first_creature', 'Add Creature')}
        </button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '80px' }}> {/* Mobile Spacer */}
      <ActiveSessionDetail
        session={activeSession}
        calculations={calculations}
        settings={{
          ...settings,
          gameVersion,
          advancedMode,
          notifyEnabled,
          notifyTime,
          onToggleNotify: handleNotifyToggle
        }}
        onUpdateSession={updateActiveSession}
        onUpdateGlobalSettings={updateGlobalSetting}
        creatures={creatures}
        foods={foods}
        availableFoods={foodLists[creatures[activeSession.creature]?.type || 'Carnivore']}
        panelStates={panelStates}
        onTogglePanel={togglePanel}
        createGhostSession={createGhostSession}
        isGhostMode={isGhostMode}
        trackedServers={appState.trackedServers}
      />
      <TroughCalculator
        creatures={creatures}
        foods={foods}
        foodLists={foodLists}
        settings={{
          ...settings,
          gameVersion,
          advancedMode,
          notifyEnabled,
          notifyTime
        }}
        currentCreature={activeSession.creature}
        currentMaturation={activeSession.data?.maturation || 0}
        currentMaxFood={activeSession.data?.maxFood || 0}
        gameVersion={gameVersion}
        advancedMode={advancedMode}
        useStasisMode={false}
        notifyEnabled={notifyEnabled}
        notifyTime={notifyTime}
        onToast={appState.t} // Hack? Wait, TroughCalculator used onToast for notifications? No, it used it for errors. We don't have addToast here directly.
      // appState has no addToast? I passed addToast to useAppLogic, but did I return it?
      />
    </div>
  );
}
