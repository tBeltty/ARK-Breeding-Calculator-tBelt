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
                value={calculations?.toJuvFoodItems.toLocaleString()}
            />
            <DataRow
                label={translate('fields.food_to_adult')}
                tooltip={translate('tooltips.to_adult_food')}
                value={calculations?.toAdultFoodItems.toLocaleString()}
            />
            <DataRow
                label={translate('fields.food_rate')}
                tooltip={translate('tooltips.food_rate')}
                value={translate('ui.food_rate_value', { rate: calculations?.currentFoodRate.toFixed(4) })}
            />
        </DataPanel>
    );
}
