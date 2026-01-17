import { useState, useEffect } from 'react';
import styles from './DataPanel.module.css';

/**
 * DataPanel Component
 * Collapsible panel that displays breeding data in a table format.
 * 
 * Props:
 * - title: string - Panel header title
 * - isOpen: boolean - Whether panel is expanded
 * - onToggle: () => void - Callback to toggle panel
 * - children: ReactNode - Panel content
 */
export function DataPanel({ title, isOpen = true, onToggle, children }) {
    return (
        <section className={styles.panel}>
            <header
                className={`${styles.header} ${!isOpen ? styles.collapsed : ''}`}
                onClick={onToggle}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onToggle?.()}
            >
                <h3 className={styles.title}>{title}</h3>
                <span className={`${styles.chevron} ${isOpen ? styles.open : ''}`}>▼</span>
            </header>
            {isOpen && (
                <div className={styles.content}>
                    {children}
                </div>
            )}
        </section>
    );
}

/**
 * LabelWithTooltip Component
 * Standardized label with an optional info icon and tooltip.
 */
export function LabelWithTooltip({ label, tooltip, className }) {
    return (
        <div className={`${styles.labelContainer} ${className || ''}`}>
            <span className={styles.label}>{label}</span>
            {tooltip && <span className={styles.infoIcon} title={tooltip}>ⓘ</span>}
        </div>
    );
}

/**
 * DataRow Component
 * Single row in a data table with label and value.
 * 
 * Props:
 * - label: string - Row label
 * - tooltip: string - Optional tooltip on hover
 * - value: ReactNode - The data value
 */
export function DataRow({ label, value, tooltip, highlight = false }) {
    return (
        <div className={`${styles.row} ${highlight ? styles.highlighted : ''}`}>
            <LabelWithTooltip label={label} tooltip={tooltip} />
            <span className={`${styles.value} ${highlight ? styles.highlightValue : ''}`}>{value}</span>
        </div>
    );
}

/**
 * DataInput Component
 * Row with an input field, supporting steppers and decimal input.
 * 
 * Props:
 * - label: string - Row label
 * - tooltip: string - Optional tooltip
 * - value: number - Current value
 * - onChange: (value: number) => void - Change handler
 * - type: 'number' | 'text' | 'checkbox'
 * - min/max/step: number - Input constraints
 * - suffix: string - Unit suffix (e.g., "%", "Minutes")
 * - placeholder: string - Placeholder text
 * - showSteppers: boolean - Show +/- buttons (default true for number)
 * - decimals: number - Decimal places to allow (default 2)
 */
export function DataInput({
    label,
    tooltip,
    value,
    onChange,
    type = 'number',
    min = 0,
    max,
    step = 1,
    suffix,
    placeholder = '0',
    showSteppers = true,
    decimals = 2
}) {
    // Use string state to allow editing without immediate conversion
    const [displayValue, setDisplayValue] = useState('');

    // Sync display value with prop value
    useEffect(() => {
        if (document.activeElement?.dataset?.inputId !== label) {
            setDisplayValue(value !== undefined && value !== null ? String(value) : '');
        }
    }, [value, label]);

    const handleChange = (e) => {
        if (type === 'checkbox') {
            onChange(e.target.checked);
            return;
        }

        // Allow typing freely - don't convert yet
        const raw = e.target.value;

        // Allow empty, numbers, decimals, and negative
        if (raw === '' || raw === '-' || /^-?\d*\.?\d*$/.test(raw)) {
            setDisplayValue(raw);
        }
    };

    const handleBlur = () => {
        // Convert to number on blur
        const parsed = parseFloat(displayValue);
        if (!isNaN(parsed)) {
            const clamped = max !== undefined ? Math.min(parsed, max) : parsed;
            const clampedMin = min !== undefined ? Math.max(clamped, min) : clamped;
            const rounded = Number(clampedMin.toFixed(decimals));
            onChange(rounded);
            setDisplayValue(String(rounded));
        } else {
            // Reset to previous value if invalid
            setDisplayValue(value !== undefined ? String(value) : '');
        }
    };

    const handleStep = (delta) => {
        const current = parseFloat(displayValue) || 0;
        const newValue = current + delta;
        const clamped = max !== undefined ? Math.min(newValue, max) : newValue;
        const clampedMin = min !== undefined ? Math.max(clamped, min) : clamped;
        const rounded = Number(clampedMin.toFixed(decimals));
        onChange(rounded);
        setDisplayValue(String(rounded));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            handleStep(step);
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            handleStep(-step);
        }
    };

    return (
        <div className={styles.row}>
            <LabelWithTooltip label={label} tooltip={tooltip} />
            <span className={styles.inputWrapper}>
                {type === 'checkbox' ? (
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={handleChange}
                        className={styles.checkbox}
                    />
                ) : (
                    <>
                        {showSteppers && (
                            <button
                                type="button"
                                className={styles.stepper}
                                onClick={() => handleStep(-step)}
                                tabIndex={-1}
                            >
                                −
                            </button>
                        )}
                        <input
                            type="text"
                            inputMode="decimal"
                            data-input-id={label}
                            value={displayValue}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className={styles.input}
                        />
                        {showSteppers && (
                            <button
                                type="button"
                                className={styles.stepper}
                                onClick={() => handleStep(step)}
                                tabIndex={-1}
                            >
                                +
                            </button>
                        )}
                    </>
                )}
                {suffix && <span className={styles.suffix}>{suffix}</span>}
            </span>
        </div>
    );
}

export default DataPanel;
