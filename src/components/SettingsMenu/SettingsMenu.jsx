import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SettingsMenu.module.css';

export function SettingsMenu({
    _advancedMode,
    _onToggleAdvanced,
    _useStasisMode,
    _onToggleStasisMode,
    notifyEnabled,
    onToggleNotify,
    notifyTime,
    onNotifyTimeChange
}) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className={styles.settingsMenu} ref={menuRef}>
            <button
                className={`${styles.gearButton} ${isOpen ? styles.active : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title={t('ui.settings')}
            >
                ⚙️
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.menuHeader}>
                        {t('ui.settings')}
                    </div>

                    {/* Advanced Mode Hidden for now
                    <div className={styles.menuItem}>
                        <div className={styles.menuLabel}>
                            <span>🧠 {t('ui.advanced_mode')}</span>
                            <span className={styles.menuDesc}>{t('ui.advanced_mode_desc')}</span>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={advancedMode}
                                onChange={(e) => onToggleAdvanced(e.target.checked)}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {advancedMode && (
                        <div className={`${styles.menuItem} ${styles.subItem}`}>
                            <div className={styles.menuLabel}>
                                <span>🛑 {t('ui.stasis_mode')}</span>
                                <span className={styles.menuDesc}>{t('ui.stasis_mode_desc')}</span>
                            </div>
                            <label className={styles.switch}>
                                <input
                                    type="checkbox"
                                    checked={useStasisMode}
                                    onChange={(e) => onToggleStasisMode(e.target.checked)}
                                />
                                <span className={styles.slider}></span>
                            </label>
                        </div>
                    )}

                    <div className={styles.separator} />
                    */}

                    <div className={styles.menuItem}>
                        <div className={styles.menuLabel}>
                            <span>🔔 {t('notifications.enable_push_tooltip')}</span>
                        </div>
                        <label className={styles.switch}>
                            <input
                                type="checkbox"
                                checked={notifyEnabled}
                                onChange={onToggleNotify}
                            />
                            <span className={styles.slider}></span>
                        </label>
                    </div>

                    {notifyEnabled && (
                        <div className={styles.subMenu}>
                            <label>{t('ui.notify_before')}:</label>
                            <select
                                value={notifyTime}
                                onChange={(e) => onNotifyTimeChange(Number(e.target.value))}
                                className={styles.miniSelect}
                            >
                                <option value={5}>5m</option>
                                <option value={10}>10m</option>
                                <option value={30}>30m</option>
                            </select>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
