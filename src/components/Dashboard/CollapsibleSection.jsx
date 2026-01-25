import { useState } from 'react';
import styles from './CollapsibleSection.module.css';

export function CollapsibleSection({ title, children, defaultOpen = false, icon }) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`${styles.section} ${isOpen ? styles.open : ''}`}>
            <button
                className={styles.trigger}
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <div className={styles.titleArea}>
                    {icon && <span className={styles.icon}>{icon}</span>}
                    <h3 className={styles.title}>{title}</h3>
                </div>
                <span className={styles.arrow}>{isOpen ? '▼' : '▶'}</span>
            </button>
            <div className={styles.contentWrapper}>
                <div className={styles.content}>
                    {children}
                </div>
            </div>
        </div>
    );
}
