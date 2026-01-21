import React from 'react';
import PropTypes from 'prop-types';
import { Modal } from './Modal';
import styles from './Modal.module.css'; // Reusing Modal styles, maybe extending?

// We'll use inline styles or existing classes for the footer buttons to keep it simple and consistent
export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', width: '100%' }}>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: 'var(--text-secondary)',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        style={{
                            background: isDangerous ? '#ef4444' : 'var(--primary)',
                            border: 'none',
                            color: '#fff',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            }
        >
            <div style={{ padding: '12px 4px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {message}
            </div>
        </Modal>
    );
}

ConfirmationModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    isDangerous: PropTypes.bool
};
