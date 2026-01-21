import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import './styles/tokens.css';
import './styles/globals.css';
import './i18n';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

import { AppSidebar } from './components/Sidebar/AppSidebar';
import { NotificationManager } from './infrastructure/NotificationManager';
import { useToast } from './components/Toast';

import { AddDinoModal } from './components/AddDinoModal';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingWizard } from './components/Onboarding';
import { TroughCalculator } from './components/TroughCalculator';

// New Components
import { MainLayout } from './components/Layout/MainLayout';
import { ActiveSessionDetail } from './components/Session/ActiveSessionDetail';



const MAX_ACTIVE_TRACKING = 20;

// Domain
import { calculateMaturationTime } from './domain/breeding';

// Application
import { calculateBreedingStats } from './application/usecases';

// Infrastructure
import { loadSettings, saveSettings } from './infrastructure/LocalStorageSettingsRepository';

// Hooks
import { useMultiDinoState } from './hooks/useMultiDinoState';

// Data
import { version } from '../package.json';
import creatures from './data/creatures.json';
import { getCreatureIcon } from './utils/creatureIcons';
import { CreateSession } from './application/usecases/CreateSession';
import foods from './data/foods.json';
import foodLists from './data/foodLists.json';

import styles from './App.module.css';

export default function App() {
  const { t } = useTranslation();
  const { addToast, ToastContainer } = useToast();

  // Multi-Dino State Management
  const {
    sessions,
    activeSessionId,
    activeSession,
    addSession,
    removeSession,
    switchSession,
    updateActiveSession,
    updateSession,
    setSessions
  } = useMultiDinoState();

  // Global Settings (Shared across dinos)
  const [settings, setSettings] = useState(loadSettings);

  // Persist Global Settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Global App State
  const [gameVersion, setGameVersion] = useState(() => localStorage.getItem('gameVersion') || 'ASA');
  const [activeTheme, setActiveTheme] = useState(() => localStorage.getItem('activeTheme') || 'arat-prime');
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'en');

  // UI States
  const [panelStates, setPanelStates] = useState({
    creature: true,
    maturation: true,
    baby: true,
    food: true,
    settings: false
  });

  // Trough/Global Settings
  const [advancedMode] = useState(false);
  const [notifyEnabled, setNotifyEnabled] = useState(() => localStorage.getItem('notifyEnabled') === 'true');
  const [notifyTime, setNotifyTime] = useState(10);

  // Apply Theme & Language
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
  }, [activeTheme]);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, [language]);


  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  // Wrapper for adding session to enforce limit if trying to auto-start
  const handleAddSession = useCallback((data) => {
    if (data.isPlaying) {
      const activeCount = sessions.filter(s => s.data && s.data.isPlaying).length;
      if (activeCount >= MAX_ACTIVE_TRACKING) {
        addToast(t('errors.tracking_limit_reached', { limit: MAX_ACTIVE_TRACKING }), 'warning');
        addSession({ ...data, isPlaying: false });
        return;
      }
    }
    addSession(data);
  }, [sessions, addSession, addToast, t]);

  const toggleTimer = () => {
    updateActiveSession((prev) => {
      if (!prev.data.isPlaying) {
        const activeCount = sessions.filter(s => s.data && s.data.isPlaying).length;
        if (activeCount >= MAX_ACTIVE_TRACKING) {
          addToast(t('errors.tracking_limit_reached', { limit: MAX_ACTIVE_TRACKING }), 'error');
          return prev;
        }
      }
      return {
        data: {
          ...prev.data,
          isPlaying: !prev.data.isPlaying
        }
      };
    });
  };

  // use recursion lock
  const isNotifyProcessingRef = useRef(false);

  const handleNotifyToggle = async () => {
    if (isNotifyProcessingRef.current) {
      return;
    }

    isNotifyProcessingRef.current = true;
    try {
      if (!notifyEnabled) {
        const granted = await NotificationManager.requestPermission();

        if (granted) {
          setNotifyEnabled(true);
          addToast(t('messages.notification_enabled'), 'success');
        } else {
          if ('Notification' in window && Notification.permission === 'denied') {
            addToast(t('notifications.perm_blocked_hint'), 'error', 5000);
          } else {
            addToast(t('notifications.perm_denied'), 'error');
          }
          setNotifyEnabled(false);
        }
      } else {
        setNotifyEnabled(false);
        addToast(t('messages.notification_disabled'), 'info');
      }
    } catch (error) {
      console.error('Notification toggle error:', error);
    } finally {
      setTimeout(() => {
        isNotifyProcessingRef.current = false;
      }, 1500);
    }
  };

  const updateGlobalSetting = (key, value) => {
    if (key === 'activeTheme') {
      setActiveTheme(value);
      localStorage.setItem('activeTheme', value);
    }
    else setSettings(prev => ({ ...prev, [key]: value }));
  };

  const togglePanel = (panel) => {
    setPanelStates(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  // Calculations
  const calculations = useMemo(() => {
    if (!activeSession || !activeSession.creature) return null;
    const creature = creatures[activeSession.creature];
    const food = foods[activeSession.data.selectedFood || 'Raw Meat']; // Default safe fallback
    if (!food || !creature) return null;

    try {
      return calculateBreedingStats({
        creature,
        food,
        weight: activeSession.data.weight || 0,
        maturationProgress: activeSession.data.maturation || 0,
        settings
      });
    } catch (error) {
      console.error('Calculation error:', error);
      return null;
    }
  }, [activeSession, settings]);

  // Global Maturation Timer (Ticks for ALL active sessions)
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(prevSessions => {
        let hasChanges = false;
        const nextSessions = prevSessions.map(session => {
          if (!session.data?.isPlaying) return session;

          const sCreature = creatures[session.creature];
          if (!sCreature) return session;

          const totalSeconds = calculateMaturationTime(sCreature, settings);
          if (!totalSeconds) return session;

          const currentMat = session.data.maturation || 0;
          if (currentMat >= 1) {
            hasChanges = true;
            return {
              ...session,
              data: { ...session.data, isPlaying: false, maturation: 1 }
            };
          }

          const increment = 1 / totalSeconds;
          const nextMat = Math.min(1, currentMat + increment);

          hasChanges = true;
          return {
            ...session,
            data: { ...session.data, maturation: nextMat }
          };
        });

        return hasChanges ? nextSessions : prevSessions;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [setSessions, settings]);

  // Persist Global Settings
  useEffect(() => {
    localStorage.setItem('gameVersion', gameVersion);
    localStorage.setItem('language', language);
    localStorage.setItem('notifyEnabled', notifyEnabled);
    localStorage.setItem('activeTheme', activeTheme);
  }, [gameVersion, language, notifyEnabled, activeTheme]);

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return localStorage.getItem('onboardingCompleted') !== 'v2.5';
  });

  const handleOnboardingComplete = (creatureData) => {
    setShowOnboarding(false);
    localStorage.setItem('onboardingCompleted', 'v2.5'); // Ensure we save this!
    if (creatureData) {
      // Create fresh session from onboarding data
      const newSession = CreateSession.execute({
        initialData: {
          creature: creatureData.creature,
          name: creatureData.name,
          weight: creatureData.weight,
          maturationPct: creatureData.maturationPct,
          isPlaying: creatureData.isPlaying
        },
        existingCount: 0
      });
      // Replace entire session list to remove default Argentavis
      setSessions([newSession]);
      switchSession(newSession.id);
    }
  };

  if (showOnboarding) {
    return (
      <OnboardingWizard
        creatures={creatures}
        globalSettings={{
          language,
          setLanguage,
          gameVersion,
          setGameVersion,
          activeTheme,
          setActiveTheme,
          onToggleNotify: handleNotifyToggle
        }}
        onComplete={handleOnboardingComplete}
      />
    );
  }

  // Header Component for Layout
  const Header = (
    <header className={styles.header}>
      <div className={styles.headerMain}>
        <img src="/logo.png?v=3" alt="ARK Breeding Calculator" className={styles.logo} />
        <div className={styles.headerText}>
          <h1 className={styles.title}>{t('title')}</h1>
          <p className={styles.subtitle}>v{version} • {t('ui.version_edition', { version: gameVersion })}</p>
        </div>
      </div>
    </header>
  );

  return (
    <MainLayout
      sidebar={
        <AppSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSwitch={switchSession}
          onOpenAddModal={handleOpenAddModal}
          onRemove={removeSession}
          onRename={(id, name) => updateSession(id, { name })}
          onToggleTimer={(id) => {
            // Logic duplication check? 
            // Should we refactor this into a proper handler in App? 
            // For now, keeping logic here as it depends on App scope state/methods
            if (activeSessionId === id && activeSession?.data) {
              toggleTimer();
            } else {
              const targetSession = sessions.find(s => s.id === id);
              if (targetSession) {
                if (!targetSession.data.isPlaying) {
                  const activeCount = sessions.filter(s => s.data && s.data.isPlaying).length;
                  if (activeCount >= MAX_ACTIVE_TRACKING) {
                    addToast(t('errors.tracking_limit_reached', { limit: MAX_ACTIVE_TRACKING }), 'error');
                    return;
                  }
                }
                updateSession(id, (prev) => ({
                  data: { ...prev.data, isPlaying: !prev.data.isPlaying }
                }));
              }
            }
          }}
          creatures={creatures}
          globalSettings={{
            language,
            setLanguage,
            activeTheme,
            setActiveTheme,
            gameVersion,
            setGameVersion,
            openSettingsModal: () => setIsSettingsModalOpen(true)
          }}
        />
      }
      header={Header}
      modals={
        <>
          <AddDinoModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={handleAddSession}
            creatures={creatures}
          />
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            globalSettings={{
              language,
              setLanguage,
              activeTheme,
              setActiveTheme,
              gameVersion,
              setGameVersion,
              notifyEnabled,
              onToggleNotify: handleNotifyToggle,
              notifyTime,
              setNotifyTime
            }}
          />
          <ToastContainer />
        </>
      }
    >
      <div style={{ paddingBottom: '80px' }}> {/* Mobile Spacer */}
        {activeSession ? (
          <>
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
              availableFoods={foodLists[creatures[activeSession?.creature]?.type || 'Carnivore']}
              panelStates={panelStates}
              onTogglePanel={togglePanel}
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
              currentCreature={activeSession?.creature}
              currentMaturation={activeSession?.data?.maturation || 0}
              currentMaxFood={activeSession?.data?.maxFood || 0}
              gameVersion={gameVersion}
              advancedMode={advancedMode}
              useStasisMode={false}
              notifyEnabled={notifyEnabled}
              notifyTime={notifyTime}
              onToast={addToast}
            />
          </>
        ) : (
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
        )}
      </div>
    </MainLayout>
  );
}
