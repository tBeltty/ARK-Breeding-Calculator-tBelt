import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataPanel, DataInput } from '../../DataPanel';

export function SettingsPanel({
    isOpen,
    onToggle,
    settings,
    onUpdateGlobalSettings
}) {
    const { t } = useTranslation();

    return (
        <DataPanel
            title={t('panels.settings')}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <DataInput
                label="Auto-Rates (Official)"
                tooltip="Automatically sync with official 1x/2x/3x events"
                value={settings.autoRatesEnabled}
                onChange={(v) => onUpdateGlobalSettings('autoRatesEnabled', v)}
                type="checkbox"
            />

            <DataInput
                label={t('fields.hatch_speed')}
                tooltip={t('tooltips.hatch_speed')}
                value={settings.hatchSpeed}
                onChange={(v) => onUpdateGlobalSettings('hatchSpeed', v)}
                min={0.1}
                step={0.1}
                disabled={settings.autoRatesEnabled}
            />
            <DataInput
                label={t('fields.maturation_speed')}
                tooltip={t('tooltips.maturation_speed')}
                value={settings.maturationSpeed}
                onChange={(v) => onUpdateGlobalSettings('maturationSpeed', v)}
                min={0.1}
                step={0.1}
                disabled={settings.autoRatesEnabled}
            />
            <DataInput
                label={t('fields.consumption_speed')}
                tooltip={t('tooltips.consumption_speed')}
                value={settings.consumptionSpeed}
                onChange={(v) => onUpdateGlobalSettings('consumptionSpeed', v)}
                min={0.1}
                step={0.1}
                disabled={settings.autoRatesEnabled}
            />
            {settings.gameVersion === 'ASE' && (
                <>
                    <DataInput
                        label={t('fields.gen2_hatch')}
                        tooltip={t('tooltips.gen2_hatch')}
                        value={settings.gen2HatchEffect}
                        onChange={(v) => onUpdateGlobalSettings('gen2HatchEffect', v)}
                        type="checkbox"
                    />
                    <DataInput
                        label={t('fields.gen2_growth')}
                        tooltip={t('tooltips.gen2_growth')}
                        value={settings.gen2GrowthEffect}
                        onChange={(v) => onUpdateGlobalSettings('gen2GrowthEffect', v)}
                        type="checkbox"
                    />
                </>
            )}
        </DataPanel>
    );
}
