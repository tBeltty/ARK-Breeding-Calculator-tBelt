import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Modal } from '../Modal';
import { CreatureSelector } from '../CreatureSelector';
import { DataInput } from '../DataPanel';
import styles from './AddDinoModal.module.css';

import { getNickname } from '../../utils/nicknames';

export function AddDinoModal({ isOpen, onClose, onAdd, creatures }) {
    const { t } = useTranslation();

    // Form State
    const [creature, setCreature] = useState('');
    const [name, setName] = useState('');
    const [weight, setWeight] = useState('');
    const [maturation, setMaturation] = useState('0');
    const [isPlaying, setIsPlaying] = useState(false);

    // Reset form on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                setCreature('Argentavis');
                setName(getNickname('Argentavis'));
                setWeight(creatures['Argentavis']?.weight || '');
                setMaturation('0');
                setIsPlaying(false);
            }, 0);
        }
    }, [isOpen, creatures]);

    const handleFocus = (e) => e.target.select();

    const handleCreatureChange = (newCreature) => {
        setCreature(newCreature);
        setName(getNickname(newCreature));
        if (creatures[newCreature]) {
            setWeight(creatures[newCreature].weight || '');
        }
    };

    // Format Data & Submit
    const handleSubmit = (e) => {
        // ... (unchanged)
        e.preventDefault();
        onAdd({
            creature: creature || 'Argentavis',
            name: name.trim() || undefined,
            weight: Number(weight) || 0,
            maturation: Number(maturation) / 100,
            isPlaying
        });
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('ui.add_dino_title', 'Add New Creature')}
        >
            <form onSubmit={handleSubmit} className={styles.form}>

                {/* Creature Select */}
                <div className={styles.field}>
                    <CreatureSelector
                        creatures={creatures}
                        selectedCreature={creature}
                        onSelect={handleCreatureChange}
                    />
                </div>

                {/* Name */}
                <div className={styles.field}>
                    <label className={styles.label}>{t('fields.dino_name')}</label>
                    <input
                        className={styles.input}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={handleFocus}
                        placeholder={`${creature || 'Creature'} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                    />
                </div>

                {/* Weight & Maturation Row */}
                <div className={styles.row}>
                    <div className={styles.field}>
                        <label className={styles.label}>{t('fields.weight')}</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            onFocus={handleFocus}
                            step="1"
                            min="0"
                            placeholder="0"
                        />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>{t('fields.maturation_pct')}</label>
                        <div className={styles.inputWithSuffix}>
                            <input
                                type="number"
                                className={styles.input}
                                value={maturation}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (parseFloat(val) > 100) val = '100';
                                    setMaturation(val);
                                }}
                                onFocus={handleFocus}
                                step="0.1"
                                min="0"
                                max="100"
                                placeholder="0"
                            />
                            <span className={styles.suffix}>%</span>
                        </div>
                    </div>
                </div>

                {/* Tracking Toggle */}
                <div className={styles.toggleRow}>
                    <label
                        className={styles.toggleLabel}
                        title={t('tooltips.start_tracking_desc', 'Automatically increment maturation based on species growth rate')}
                    >
                        <input
                            type="checkbox"
                            checked={isPlaying}
                            onChange={(e) => setIsPlaying(e.target.checked)}
                            className={styles.checkbox}
                        />
                        <span className={styles.toggleText}>
                            {t('ui.start_tracking', 'Start Tracking')}
                        </span>
                    </label>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button type="button" onClick={onClose} className={styles.cancelBtn}>
                        {t('ui.cancel')}
                    </button>
                    <button type="submit" className={styles.addBtn}>
                        {t('ui.add_current')}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

AddDinoModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onAdd: PropTypes.func.isRequired,
    creatures: PropTypes.object.isRequired
};
