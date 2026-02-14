import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataPanel, DataRow } from '../../DataPanel';

export function FoodPanel({
    isOpen,
    onToggle,
    calculations,
    t // pass t if needed or use hook
}) {
    // If we use hook here it duplicates, but it's fine
    const { t: tHook } = useTranslation();
    const translate = t || tHook;

    return (
        <DataPanel
            title={translate('panels.food')}
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <DataRow
                label={translate('fields.food_to_juvenile')}
                tooltip={translate('tooltips.to_juv_food')}
                value={
                    calculations?.toJuvFoodItems > 0
                        ? calculations.toJuvFoodItems.toLocaleString()
                        : translate('ui.ready')
                }
            />
            {calculations?.toJuvFoodItems > 0 && (
                <DataRow
                    label={translate('fields.total_required')}
                    value={(calculations?.totalJuvFoodItems || 0).toLocaleString()}
                    highlight={false}
                />
            )}

            <DataRow
                label={translate('fields.food_to_adult')}
                tooltip={translate('tooltips.to_adult_food')}
                value={calculations?.toAdultFoodItems.toLocaleString()}
            />
            {calculations?.toAdultFoodItems > 0 && (
                <DataRow
                    label={translate('fields.total_required')}
                    value={(calculations?.totalFoodItems || 0).toLocaleString()}
                    highlight={false}
                />
            )}

            <DataRow
                label={translate('fields.food_rate')}
                tooltip={translate('tooltips.food_rate')}
                value={translate('ui.food_rate_value', { rate: Math.round(calculations?.currentFoodRate || 0).toLocaleString() })}
            />
        </DataPanel>
    );
}
