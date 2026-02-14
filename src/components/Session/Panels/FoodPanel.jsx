import React from 'react';
import { useTranslation } from 'react-i18next';
import { DataPanel, DataRow } from '../../DataPanel';

export function FoodPanel({
    isOpen,
    onToggle,
    calculations,
    foods,
    availableFoods,
    activeData,
    onUpdateSession,
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
                label={translate('fields.selected_food')}
                tooltip={translate('tooltips.selected_food')}
            >
                <select
                    value={activeData?.selectedFood || ''}
                    onChange={(e) => {
                        onUpdateSession({
                            data: { ...activeData, selectedFood: e.target.value }
                        });
                    }}
                    style={{
                        padding: '4px 8px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgb(var(--outline) / 0.3)',
                        background: 'rgb(var(--surface-container-high))',
                        color: 'rgb(var(--on-surface))',
                        width: '100%',
                        maxWidth: '200px'
                    }}
                >
                    {availableFoods?.map(foodKey => (
                        <option key={foodKey} value={foodKey}>
                            {foods?.[foodKey]?.name || foodKey}
                        </option>
                    ))}
                </select>
            </DataRow>

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
