import React from 'react';
import styles from '../../App.module.css';

export function MainLayout({
    sidebar,
    header,
    children,
    modals
}) {
    return (
        <div className={styles.app}>
            {sidebar}
            {modals}
            <div className={styles.contentWrapper}>
                <div className={styles.container}>
                    {header}
                    <main className={styles.main}>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
