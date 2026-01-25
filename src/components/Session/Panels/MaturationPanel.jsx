import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataPanel, DataRow, DataInput } from '../../DataPanel';
import { formatTime } from '../../../domain/breeding';

export function MaturationPanel({
    isOpen,
    onToggle,
    calculations,
    maturationProgress,
    onUpdateSession,
    activeData
}) {
    const { t } = useTranslation();

    const updateDinoData = (key, value) => {
        onUpdateSession({
            data: { ...activeData, [key]: value }
        });
    };

    return (
        <DataPanel
            title={t('panels.maturation')}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <DataRow
                label={t(`birth_types.${calculations?.birthLabel}`)}
                tooltip={t('tooltips.birth_time')}
                value={formatTime(calculations?.birthTime)}
            />
            <DataInput
                label={t('fields.maturation_pct')}
                tooltip={t('tooltips.maturation_pct')}
                value={Number((maturationProgress * 100).toFixed(1))}
                onChange={(v) => updateDinoData('maturation', Math.min(100, Math.max(0, v)) / 100)}
                min={0}
                max={100}
                step={0.1}
                decimals={1}
                suffix="%"
            />

            <DataRow
                label={t('fields.elapsed_time')}
                tooltip={t('tooltips.elapsed_time')}
                value={formatTime(calculations?.maturationTimeComplete)}
            />
            <DataRow
                label={t('fields.time_to_juvenile')}
                tooltip={t('tooltips.time_to_juvenile')}
                value={formatTime(calculations?.babyTimeRemaining)}
            />
            <DataRow
                label={t('fields.time_to_adult')}
                tooltip={t('tooltips.time_to_adult')}
                value={formatTime(calculations?.maturationTimeRemaining)}
            />
        </DataPanel>
    );
}
