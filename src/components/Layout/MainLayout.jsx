import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { AppSidebar } from '../Sidebar/AppSidebar';
import { AddDinoModal } from '../AddDinoModal';
import { SettingsModal } from '../SettingsModal';
import { OnboardingWizard } from '../Onboarding';
import { ToastContainer } from '../Toast';
import { useToast } from '../../hooks/useToast';
import { useAppLogic } from '../../hooks/useAppLogic';
import styles from '../../App.module.css';
import { useTranslation } from 'react-i18next';
import { version } from '../../../package.json';
import creatures from '../../data/creatures.json';

export function MainLayout() {
    const { toasts, addToast, removeToast } = useToast();
    const appState = useAppLogic(addToast);
    const location = useLocation();
    const { t } = useTranslation();

    const {
        sessions, activeSessionId, activeSession, switchSession,
        removeSession, updateSession, toggleTimer, isAddModalOpen, setIsAddModalOpen,
        isSettingsModalOpen, setIsSettingsModalOpen,
        handleAddSession, handleOpenAddModal,
        gameVersion, notifyEnabled, notifyTime, handleNotifyToggle,
        setNotifyTime, showOnboarding, handleOnboardingComplete,
        language, setLanguage, activeTheme, setActiveTheme, setGameVersion,
        isGhostMode, promoteGhostSession
    } = appState;

    if (showOnboarding) {
        return (
            <OnboardingWizard
                creatures={creatures}
                globalSettings={{
                    language, setLanguage,
                    gameVersion, setGameVersion,
                    activeTheme, setActiveTheme,
                    onToggleNotify: handleNotifyToggle
                }}
                onComplete={handleOnboardingComplete}
            />
        );
    }

    // Header only for Calculator Page
    const isCalculator = location.pathname === '/';
    const isDashboard = location.pathname === '/dashboard';

    const Header = (
        <header className={styles.header}>
            <div className={styles.headerMain}>
                <Link to="/">
                    <img src="/logo.png?v=3" alt="ARK Breeding Calculator" className={styles.logo} />
                </Link>
                <div className={styles.headerText}>
                    <h1 className={styles.title}>{t('title')}</h1>
                    <p className={styles.subtitle}>v{version} • {t('ui.version_edition', { version: gameVersion })}</p>
                </div>
                {isGhostMode && (
                    <button
                        onClick={() => {
                            promoteGhostSession();
                            addToast(t('messages.save_success'), 'success');
                        }}
                        title={t('tooltips.add_ghost_session', 'Save this creature to your list to keep tracking it.')}
                        className={styles.addToListBtn}
                        style={{
                            marginLeft: 'auto',
                            background: 'rgb(var(--primary))',
                            color: 'rgb(var(--on-primary))',
                            border: '2px solid rgba(255,255,255,0.2)',
                            borderRadius: '12px',
                            padding: '10px 20px',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            transform: 'scale(1.05)',
                            transition: 'all 0.2s ease',
                            animation: 'pulse 2s infinite'
                        }}
                    >
                        + {t('ui.add_current', 'Add Current')}
                    </button>
                )}
            </div>
        </header>
    );

    return (
        <div className={styles.app}>
            <AppSidebar
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSwitch={switchSession}
                onOpenAddModal={handleOpenAddModal}
                onRemove={removeSession}
                onRename={(id, name) => updateSession(id, { name })}
                onToggleTimer={(id) => {
                    if (activeSessionId === id && activeSession?.data) {
                        toggleTimer();
                    } else {
                        const target = sessions.find(s => s.id === id);
                        if (target) {
                            updateSession(id, (prev) => ({
                                data: { ...prev.data, isPlaying: !prev.data.isPlaying }
                            }));
                        }
                    }
                }}
                creatures={creatures}
                globalSettings={{
                    language, setLanguage,
                    activeTheme, setActiveTheme,
                    gameVersion, setGameVersion,
                    openSettingsModal: () => setIsSettingsModalOpen(true)
                }}
            />

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
                        language, setLanguage,
                        activeTheme, setActiveTheme,
                        gameVersion, setGameVersion,
                        notifyEnabled, onToggleNotify: handleNotifyToggle,
                        notifyTime, setNotifyTime
                    }}
                />
                <ToastContainer toasts={toasts} removeToast={removeToast} />
            </>



            <div className={styles.contentWrapper}>
                <div className={`${styles.container} ${isDashboard ? styles.containerWide : ''}`}>
                    {isCalculator && Header}
                    <main className={styles.main}>
                        <Outlet context={appState} />
                    </main>
                </div>
            </div>
        </div>
    );
}
