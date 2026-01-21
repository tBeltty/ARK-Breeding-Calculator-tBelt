import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { getNickname } from '../../utils/nicknames';
import { getCreatureIcon } from '../../utils/creatureIcons';
import styles from './AppSidebar.module.css';
import './SidebarTooltip.css';

/**
 * Sidebar Component
 * Displays list of active creatures and allows switching/adding.
 */
export function AppSidebar({ sessions, activeSessionId, onSwitch, onOpenAddModal, onRemove, onRename, onToggleTimer, creatures, globalSettings }) {
    const { t } = useTranslation();

    // Inline editing state
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    const startEditing = (e, session) => {
        e.stopPropagation();
        setEditingId(session.id);
        setEditName(session.name || session.creature);
    };

    const saveEditing = (id) => {
        if (editName.trim()) {
            onRename(id, editName.trim());
        }
        setEditingId(null);
    };

    const handleKeyDown = (e, id) => {
        if (e.key === 'Enter') {
            saveEditing(id);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    // Group sessions by type
    const groupedSessions = React.useMemo(() => {
        const groups = {};
        sessions.forEach(session => {
            const type = creatures[session.creature]?.type || 'Unknown';
            if (!groups[type]) groups[type] = [];
            groups[type].push(session);
        });
        return groups;
    }, [sessions, creatures]);


    // Mobile expansion state
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    // Desktop collapse state
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

    // Hover state for collpased tooltip
    const [hoveredItem, setHoveredItem] = useState(null);

    const handleMouseEnter = (e, session) => {
        if (!isDesktopCollapsed) return;
        const rect = e.currentTarget.getBoundingClientRect();
        setHoveredItem({
            id: session.id,
            name: session.name || session.creature, // Full name for tooltip (custom name or full species)
            top: rect.top + (rect.height / 2),
            left: rect.right + 10 // 10px spacing
        });
    };

    const handleMouseLeave = () => {
        setHoveredItem(null);
    };



    return (
        <aside className={`${styles.sidebar} ${isMobileExpanded ? styles.expanded : ''} ${isDesktopCollapsed ? styles.collapsed : ''}`}>
            {/* Tooltip Portal */}
            {isDesktopCollapsed && hoveredItem && createPortal(
                <div
                    className="sidebarTooltip"
                    style={{
                        top: hoveredItem.top,
                        left: hoveredItem.left
                    }}
                >
                    {hoveredItem.name}
                </div>,
                document.body
            )}

            {/* Mobile Toggle Handle (Centered Pill with Actions) */}
            <div className={styles.mobileHandle} onClick={() => setIsMobileExpanded(!isMobileExpanded)}>
                <button
                    className={styles.handleBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddModal();
                    }}
                    title={t('ui.add_dino_title', 'Add')}
                >
                    +
                </button>
                <div className={styles.mobileHandleIndicator} />
                <button
                    className={styles.handleBtn}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (globalSettings.openSettingsModal) globalSettings.openSettingsModal();
                    }}
                    title={t('ui.settings', 'Settings')}
                >
                    ⚙️
                </button>
            </div>

            <div className={styles.header}>
                {!isDesktopCollapsed && <h2 className={styles.title}>{t('ui.creatures', 'Creatures')}</h2>}

                <div className={styles.headerActions}>
                    {/* Desktop Toggle Button */}
                    <button
                        className={styles.desktopToggle}
                        onClick={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                        title={isDesktopCollapsed ? "Expand" : "Collapse"}
                    >
                        {isDesktopCollapsed ? '»' : '«'}
                    </button>

                    <button
                        className={styles.addButton}
                        onClick={onOpenAddModal}
                        title={t('ui.add_dino_title', 'Add New Creature')}
                    >
                        +
                    </button>
                </div>
            </div>

            <div className={styles.scrollableContent}>
                {Object.entries(groupedSessions).map(([type, typeSessions]) => (
                    <div key={type} className={styles.categoryParam}>
                        {!isDesktopCollapsed && <h3 className={styles.categoryTitle}>{t('creature_types_plural.' + type, { defaultValue: type })}</h3>}
                        <ul className={styles.list}>
                            {typeSessions.map(session => (
                                <li
                                    key={session.id}
                                    className={`${styles.item} ${session.id === activeSessionId ? styles.active : ''}`}
                                    onClick={() => onSwitch(session.id)}
                                    onMouseEnter={(e) => handleMouseEnter(e, session)}
                                    onMouseLeave={handleMouseLeave}
                                    title={!isDesktopCollapsed ? (session.name || session.creature) : ''}
                                    style={{ '--creature-bg': `url('${getCreatureIcon(session.creature)}')` }}
                                >
                                    {editingId === session.id ? (
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onBlur={() => saveEditing(session.id)}
                                            onKeyDown={(e) => handleKeyDown(e, session.id)}
                                            autoFocus
                                            onClick={(e) => e.stopPropagation()}
                                            className={styles.editInput}
                                        />
                                    ) : (

                                        <>
                                            {/* Grid structure adapted for collapse */}
                                            {/* Name - Shows Nickname in collapsed, Full Name in expanded */}
                                            <span className={styles.itemName}>
                                                {isDesktopCollapsed ? getNickname(session.creature) : (session.name || getNickname(session.creature))}
                                            </span>

                                            {/* Detail/Type - Hidden when collapsed */}
                                            <span className={`${styles.itemDetail} ${isDesktopCollapsed ? styles.hidden : ''}`}>
                                                {getNickname(session.creature)}
                                            </span>

                                            {/* Percentage & Play/Pause */}
                                            <div className={`${styles.percentageWrapper} ${isDesktopCollapsed ? styles.compact : ''}`}>
                                                <span className={styles.percentage}>
                                                    {(session.data.maturation * 100).toFixed(1)}%
                                                </span>
                                                {!isDesktopCollapsed && (
                                                    <button
                                                        className={`${styles.trackBtn} ${session.data?.isPlaying ? styles.playing : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onToggleTimer && onToggleTimer(session.id);
                                                        }}
                                                        title={session.data?.isPlaying ? t('ui.click_to_pause', 'Pause Tracking') : t('ui.click_to_track', 'Start Tracking')}
                                                    >
                                                        {session.data?.isPlaying ? '⏸' : '▶'}
                                                    </button>
                                                )}
                                            </div>

                                            {/* Actions - Hidden when collapsed */}
                                            <div className={`${styles.sidebarActions} ${isDesktopCollapsed ? styles.hidden : ''}`}>
                                                <button
                                                    className={styles.actionButton}
                                                    onClick={(e) => startEditing(e, session)}
                                                    title={t('ui.rename', 'Rename')}
                                                >
                                                    ✎
                                                </button>
                                                <button
                                                    className={`${styles.actionButton} ${styles.delete}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onRemove(session.id);
                                                    }}
                                                    title={t('ui.remove', 'Remove')}
                                                >
                                                    &times;
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className={styles.footer}>
                <div className={`${styles.credits} ${isDesktopCollapsed ? styles.hidden : ''}`}>
                    <small className={styles.creditText}>
                        {t('ui.credit_prefix', 'Original by')}{' '}
                        <a
                            href="https://github.com/Crumplecorn/ARK-Breeding-Calculator"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.textLink}
                        >
                            Crumplecorn
                        </a>
                    </small>
                    <small className={styles.creditText}>{t('ui.remake_credit', 'Remake by tBelt')}</small>
                    <a
                        href="https://github.com/tBeltty/ARK-Breeding-Calculator-tBelt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.repoLink}
                        title="View Repository"
                    >
                        <span className={styles.githubIcon}>GitHub</span>
                    </a>
                    <small className={styles.disclaimer}>{t('notifications.disclaimer', 'Not affiliated with Studio Wildcard')}</small>
                </div>
                <button
                    className={styles.configBtn}
                    onClick={() => globalSettings.openSettingsModal()}
                    title={t('ui.settings')}
                >
                    <span className={styles.configBtnIcon}>⚙️</span>
                    {!isDesktopCollapsed && <span>{t('ui.settings', 'Settings')}</span>}
                </button>
            </div>
        </aside >
    );
}

AppSidebar.propTypes = {
    sessions: PropTypes.array.isRequired,
    activeSessionId: PropTypes.string,
    onSwitch: PropTypes.func.isRequired,
    onOpenAddModal: PropTypes.func.isRequired,
    onRemove: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onToggleTimer: PropTypes.func, // Optional for now until wired
    creatures: PropTypes.object.isRequired
};
