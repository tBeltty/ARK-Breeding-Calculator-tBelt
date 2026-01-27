import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../hooks/useTheme';
import styles from './HelpPage.module.css';

export default function HelpPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    // Ensure the theme from main app is applied to the body
    useTheme();

    const categories = [
        {
            id: 'calculator',
            sections: [
                { id: 'calc_basic', icon: '📝' },
                { id: 'calc_buffer', icon: '⚖️' },
                { id: 'calc_handfeed', icon: '🍼' },
                { id: 'calc_trough', icon: '🍲' }
            ]
        },
        {
            id: 'bot',
            sections: [
                { id: 'install', icon: '🚀' },
                { id: 'settings', icon: '⚙️' },
                { id: 'dashboard', icon: '💻' },
                { id: 'monitoring', icon: '🛰️' }
            ]
        }
    ];

    const [activeSectionId, setActiveSectionId] = useState('calc_basic');

    const handleInviteClick = () => {
        window.open('https://ark.tbelt.online/dashboard', '_blank');
    };

    /**
     * Simple parser to handle **bold**, [link](url) and ![alt](img_path)
     */
    const renderMarkdown = (text) => {
        if (!text) return '';

        let processed = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/!\[(.*?)\]\((.*?)\)/g, `<div class="${styles.imageContainer}"><img src="$2" alt="$1" class="${styles.screenshot}" /><p class="${styles.imageCaption}">$1</p></div>`)
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="' + styles.inlineLink + '">$1</a>')
            .replace(/\n/g, '<br />');

        return processed;
    };

    const sectionContent = t(`help.sections.${activeSectionId}`, { returnObjects: true });

    // Find active icon
    let currentIcon = '';
    categories.forEach(cat => {
        const found = cat.sections.find(s => s.id === activeSectionId);
        if (found) currentIcon = found.icon;
    });

    return (
        <div className={styles.helpPageRoot}>
            <div className={styles.helpPageWrapper}>
                <header className={styles.pageHeader}>
                    <button
                        className={styles.backButton}
                        onClick={() => navigate('/')}
                        title={t('help.back_btn')}
                    >
                        ← {t('help.back_btn')}
                    </button>
                    <h1 className={styles.mainTitle}>{t('help.title')}</h1>
                    <p className={styles.headerSubtitle}>{t('help.subtitle')}</p>
                </header>

                <div className={styles.contentLayout}>
                    <aside className={styles.navigationSidebar}>
                        {categories.map(category => (
                            <div key={category.id} className={styles.categoryGroup}>
                                <h3 className={styles.categoryHeader}>
                                    {t(`help.categories.${category.id}`)}
                                </h3>
                                {category.sections.map(section => (
                                    <button
                                        key={section.id}
                                        className={`${styles.navLink} ${activeSectionId === section.id ? styles.linkActive : ''}`}
                                        onClick={() => setActiveSectionId(section.id)}
                                    >
                                        <span className={styles.navIcon}>{section.icon}</span>
                                        <span className={styles.navText}>{t(`help.sections.${section.id}.title`)}</span>
                                    </button>
                                ))}
                            </div>
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

                            {(activeSectionId === 'install' || activeSectionId === 'dashboard') && (
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
                    <p className={styles.footerNote}>{t('help.footer')}</p>
                </footer>
            </div>
        </div>
    );
}
