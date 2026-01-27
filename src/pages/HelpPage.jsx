import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import styles from './HelpPage.module.css';

export default function HelpPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const sections = [
        { id: 'install', icon: '🚀' },
        { id: 'settings', icon: '⚙️' },
        { id: 'breeding', icon: '🐣' },
        { id: 'dashboard', icon: '💻' },
        { id: 'monitoring', icon: '🛰️' }
    ];

    const [activeSectionId, setActiveSectionId] = useState('install');

    const handleInviteClick = () => {
        window.open('https://ark.tbelt.online/dashboard', '_blank');
    };

    /**
     * Simple parser to handle **bold** and [link](url)
     */
    const renderMarkdown = (text) => {
        if (!text) return '';

        let processed = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="' + styles.inlineLink + '">$1</a>');

        return processed;
    };

    const sectionContent = t(`help.sections.${activeSectionId}`, { returnObjects: true });
    const currentIcon = sections.find(s => s.id === activeSectionId)?.icon;

    return (
        <div className={styles.helpPageRoot}>
            <div className={styles.helpPageWrapper}>
                <header className={styles.pageHeader}>
                    <h1 className={styles.mainTitle}>{t('help.title')}</h1>
                    <p className={styles.headerSubtitle}>{t('help.subtitle')}</p>
                </header>

                <div className={styles.contentLayout}>
                    <aside className={styles.navigationSidebar}>
                        {sections.map(section => (
                            <button
                                key={section.id}
                                className={`${styles.navLink} ${activeSectionId === section.id ? styles.linkActive : ''}`}
                                onClick={() => setActiveSectionId(section.id)}
                            >
                                <span className={styles.navIcon}>{section.icon}</span>
                                <span className={styles.navText}>{t(`help.sections.${section.id}.title`)}</span>
                            </button>
                        ))}
                    </aside>

                    <main className={styles.viewPort}>
                        <section className={styles.contentSection}>
                            <h2 className={styles.sectionTitle}>
                                <span className={styles.titleIcon}>{currentIcon}</span>
                                {sectionContent.title}
                            </h2>
                            <div
                                className={styles.sectionBody}
                                dangerouslySetInnerHTML={{
                                    __html: renderMarkdown(sectionContent.content)
                                }}
                            />

                            {activeSectionId === 'install' && (
                                <div className={styles.highlightCard}>
                                    <button
                                        className={`${styles.actionButton} ${styles.primaryAction}`}
                                        onClick={handleInviteClick}
                                    >
                                        {t('help.invite_btn')}
                                    </button>
                                </div>
                            )}
                        </section>
                    </main>
                </div>

                <footer className={styles.pageFooter}>
                    <button
                        className={`${styles.actionButton} ${styles.secondaryAction}`}
                        onClick={() => navigate('/')}
                    >
                        {t('help.back_btn')}
                    </button>
                    <p className={styles.footerNote}>{t('help.footer')}</p>
                </footer>
            </div>
        </div>
    );
}
