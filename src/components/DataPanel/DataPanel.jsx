import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './DataPanel.module.css';

/**
 * DataPanel Component
 * Collapsible panel that displays breeding data in a table format.
 */
export function DataPanel({ title, isOpen = true, onToggle, headerActions, children }) {
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div onClick={(e) => e.stopPropagation()}>
                        {headerActions}
                    </div>
                    <span className={`${styles.chevron} ${isOpen ? styles.open : ''}`}>▼</span>
                </div>
            </header>
            {isOpen && (
                <div className={styles.content}>
                    {children}
                </div>
            )}
        </section>
    );
}

DataPanel.propTypes = {
    title: PropTypes.string.isRequired,
    isOpen: PropTypes.bool,
    onToggle: PropTypes.func,
    children: PropTypes.node
};

/**
 * LabelWithTooltip Component
 * Wraps label and renders tooltip on hover
 */
export function LabelWithTooltip({ label, tooltip, className, style }) {
    return (
        <div className={`${styles.labelContainer} ${styles.hasTooltip} ${className || ''}`} style={style}>
            <span className={styles.label}>{label}</span>
            {tooltip && <div className={styles.rowTooltip}>{tooltip}</div>}
        </div>
    );
}

LabelWithTooltip.propTypes = {
    label: PropTypes.string.isRequired,
    tooltip: PropTypes.string,
    className: PropTypes.string,
    style: PropTypes.object
};

/**
 * DataRow Component
 * Row with hover tooltip, highlight effect, and improved alignment.
 */
export function DataRow({ label, value, tooltip, highlight = false, children }) {
    return (
        <div className={`${styles.row} ${highlight ? styles.highlighted : ''} ${tooltip ? styles.hasTooltip : ''}`}>
            <LabelWithTooltip label={label} />
            <div className={`${styles.value} ${highlight ? styles.highlightValue : ''}`}>
                {value}
                {children}
            </div>
            {tooltip && <div className={styles.rowTooltip}>{tooltip}</div>}
        </div>
    );
}

DataRow.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.node,
    tooltip: PropTypes.string,
    highlight: PropTypes.bool
};

/**
 * DataInput Component
 * Row with an input field, supporting steppers and decimal input.
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
    decimals = 2,
    hideLabel = false,
    className,
    disabled = false
}) {
    // Use string state to allow editing without immediate conversion
    const [displayValue, setDisplayValue] = useState(value !== undefined && value !== null ? String(value) : '');

    // Sync display value with prop value
    useEffect(() => {
        if (value !== undefined && value !== null && String(value) !== displayValue) {
            // Only update if the prop value is different from current display (e.g. external update)
            // and we are NOT currently focusing it (avoid overwriting user typing)
            if (document.activeElement?.dataset?.inputId !== label) {
                setDisplayValue(String(value));
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, label]);

    const handleChange = (e) => {
        if (disabled) return;
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
        if (disabled) return;
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
        if (disabled) return;
        const current = parseFloat(displayValue) || 0;
        const newValue = current + delta;
        const clamped = max !== undefined ? Math.min(newValue, max) : newValue;
        const clampedMin = min !== undefined ? Math.max(clamped, min) : clamped;
        const rounded = Number(clampedMin.toFixed(decimals));
        onChange(rounded);
        setDisplayValue(String(rounded));
    };

    const handleKeyDown = (e) => {
        if (disabled) return;
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
        <div className={`${styles.row} ${className || ''} ${tooltip ? styles.hasTooltip : ''} ${disabled ? styles.disabled : ''}`}>
            {!hideLabel && <LabelWithTooltip label={label} />}
            <span className={styles.inputWrapper}>
                {type === 'checkbox' ? (
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={handleChange}
                        className={styles.checkbox}
                        disabled={disabled}
                    />
                ) : (
                    <>
                        <div className={styles.inputGroup}>
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
                                disabled={disabled}
                            />
                            {showSteppers && !disabled && (
                                <div className={styles.stepperColumn}>
                                    <button
                                        type="button"
                                        className={styles.stepperBtn}
                                        onClick={() => handleStep(step)}
                                        tabIndex={-1}
                                        disabled={disabled}
                                    >
                                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2 8L6 4L10 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.stepperBtn}
                                        onClick={() => handleStep(-step)}
                                        tabIndex={-1}
                                        disabled={disabled}
                                    >
                                        <svg width="8" height="8" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
                {suffix && <span className={styles.suffix}>{suffix}</span>}
            </span>
            {tooltip && <div className={styles.rowTooltip}>{tooltip}</div>}
        </div>
    );
}

DataInput.propTypes = {
    label: PropTypes.string.isRequired,
    tooltip: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.number, PropTypes.string, PropTypes.bool]),
    onChange: PropTypes.func.isRequired,
    type: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    step: PropTypes.number,
    suffix: PropTypes.string,
    placeholder: PropTypes.string,
    showSteppers: PropTypes.bool,
    decimals: PropTypes.number,
    hideLabel: PropTypes.bool,
    className: PropTypes.string,
    disabled: PropTypes.bool
};

export default DataPanel;
