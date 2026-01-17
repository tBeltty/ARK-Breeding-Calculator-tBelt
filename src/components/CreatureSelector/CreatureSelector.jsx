import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './CreatureSelector.module.css';
import { DataPanel, DataRow, DataInput, LabelWithTooltip } from '../DataPanel';

/**
 * CreatureSelector Component
 * Provides autocomplete search and selection for ARK creatures.
 * 
 * Props:
 * - creatures: Object - creature data keyed by name
 * - selectedCreature: string - currently selected creature name
 * - onSelect: (creatureName: string) => void - callback when creature selected
 */
export function CreatureSelector({ creatures, selectedCreature, onSelect }) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const creatureNames = useMemo(() => Object.keys(creatures).sort(), [creatures]);

    const filteredCreatures = useMemo(() => {
        if (!searchTerm) return creatureNames;
        const term = searchTerm.toLowerCase();
        return creatureNames.filter(name => name.toLowerCase().includes(term));
    }, [creatureNames, searchTerm]);

    const handleSelect = (name) => {
        onSelect(name);
        setSearchTerm('');
        setIsOpen(false);
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        setIsOpen(true);
    };

    return (
        <div className={styles.container}>
            <LabelWithTooltip
                label={t('fields.creature')}
                tooltip={t('tooltips.creature')}
                className={styles.label}
            />
            <div className={styles.inputWrapper}>
                <input
                    type="text"
                    className={styles.input}
                    placeholder={selectedCreature || t('ui.search_creatures')}
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    title={t('tooltips.creature')}
                />
                {isOpen && filteredCreatures.length > 0 && (
                    <ul className={styles.dropdown}>
                        {filteredCreatures.map(name => (
                            <li
                                key={name}
                                className={`${styles.option} ${name === selectedCreature ? styles.selected : ''}`}
                                onMouseDown={() => handleSelect(name)}
                            >
                                {name}
                                <span className={styles.type}>{creatures[name].type}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

export default CreatureSelector;
