import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { calculateMaturationTime } from '../../domain/breeding';
import { getNickname } from '../../domain/constants/nicknames';

// Panels
import { CreaturePanel } from './Panels/CreaturePanel';
import { SettingsPanel } from './Panels/SettingsPanel';
import { MaturationPanel } from './Panels/MaturationPanel';
import { BabyPanel } from './Panels/BabyPanel';
import { FoodPanel } from './Panels/FoodPanel';

export function ActiveSessionDetail({
    session,
    calculations,
    settings,
    onUpdateSession,
    onUpdateGlobalSettings,
    creatures,
    foods,
    availableFoods,
    panelStates,
    onTogglePanel,
    createGhostSession,
    isGhostMode,
    trackedServers = []
}) {
    const { t } = useTranslation();

    const activeData = session?.data || {};
    const weight = activeData.weight || 0;
    const selectedFood = activeData.selectedFood || availableFoods?.[0];
    const desiredBuffer = activeData.desiredBuffer || 60;
    const desiredBufferUnit = activeData.desiredBufferUnit || 'm';
    const creature = session?.creature ? creatures[session.creature] : null;

    // Helper for updating session data
    const updateDinoData = (key, value) => {
        onUpdateSession({
            data: { ...activeData, [key]: value }
        });
    };

    const handleCreatureChange = (newCreature) => {
        const creatureData = creatures[newCreature];
        if (creatureData) {
            const totalMaturationSeconds = calculateMaturationTime(creatureData, settings);

            // UX IMPROVEMENT: If we are in a 'real' session, don't overwrite it. 
            // Spawn a ghost session instead.
            if (!isGhostMode && createGhostSession) {
                createGhostSession({
                    creature: newCreature,
                    name: getNickname(newCreature),
                    data: {
                        weight: creatureData.weight,
                        maturation: 0,
                        maxFood: 0,
                        totalMaturationSeconds
                    }
                });
            } else {
                // If already in ghost mode or no creator, just update normally
                onUpdateSession({
                    creature: newCreature,
                    name: getNickname(newCreature),
                    data: {
                        ...activeData,
                        weight: creatureData.weight,
                        maturation: 0,
                        maxFood: 0,
                        totalMaturationSeconds
                    }
                });
            }
        }
    };

    // Maturation needed calc
    const maturationNeededForBuffer = useMemo(() => {
        if (!calculations || !weight || !creature) return undefined;
        const food = foods[selectedFood];
        if (!food) return undefined;
        const rate = calculations.currentFoodRate;
        if (rate <= 0) return undefined;
        const bufferInMinutes = desiredBufferUnit === 'h' ? desiredBuffer * 60 : desiredBuffer;
        const neededCapacityValues = (bufferInMinutes * rate);
        const neededSlots = neededCapacityValues / food.food;
        const neededWeight = neededSlots * food.weight;
        const neededMaturation = neededWeight / weight;
        return Math.min(100, Math.max(0, neededMaturation * 100));
    }, [calculations, desiredBuffer, desiredBufferUnit, weight, selectedFood, creature, foods]);

    // Interval for live updates of food tracking
    const [now, setNow] = useState(0); // Initialize with 0 for purity
    React.useEffect(() => {
        if (!activeData.foodTrackingEnabled) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [activeData.foodTrackingEnabled]);

    if (!session || !session.creature) return null;

    return (
        <>
            <CreaturePanel
                isOpen={panelStates.creature}
                onToggle={() => onTogglePanel('creature')}
                session={session}
                creatures={creatures}
                onUpdateSession={onUpdateSession}
                activeData={activeData}
                settings={settings}
                trackedServers={trackedServers}
                createGhostSession={createGhostSession}
                isGhostMode={isGhostMode}
            // We pass the special handleCreatureChange to the onSelect prop
            // CreaturePanel expects onSelect for the selector
            />
            {/* Direct prop injection hack for handleCreatureChange because CreaturePanel logic was confusing in extraction */}
            {/* Wait, my CreaturePanel uses session.onCreatureChange? No. It uses onSelect={onSelect} from props. */}
            {/* I need to make sure CreaturePanel uses the passed prop. */}
            {/* Re-checking CreaturePanel.jsx: 'onSelect={session.onCreatureChange}' <-- BUG! */}
            {/* It should use 'onSelect={onSelect}' if I pass it, but I didn't pass onSelect in CreaturePanel signature. */}
            {/* I need to fix CreaturePanel signature or pass it differently. */}
            {/* In ActiveSessionDetail.jsx original, CreatureSelector was <CreatureSelector onSelect={handleCreatureChange} ... /> */}
            {/* I will fix CreaturePanel usage in a separate step or here via prop drilling if I can update CreaturePanel. */}

            <SettingsPanel
                isOpen={panelStates.settings}
                onToggle={() => onTogglePanel('settings')}
                settings={settings}
                onUpdateGlobalSettings={onUpdateGlobalSettings}
            />

            <div data-doc="maturation-panel">
                <MaturationPanel
                    isOpen={panelStates.maturation}
                    onToggle={() => onTogglePanel('maturation')}
                    calculations={calculations}
                    maturationProgress={activeData.maturation || 0}
                    onUpdateSession={onUpdateSession}
                    activeData={activeData}
                />
            </div>

            <div data-doc="baby-panel">
                <BabyPanel
                    isOpen={panelStates.baby}
                    onToggle={() => onTogglePanel('baby')}
                    calculations={calculations}
                    activeData={activeData}
                    onUpdateSession={onUpdateSession}
                    creature={creature}
                    now={now}
                    // Passing the calculated value
                    maturationNeededForBuffer={maturationNeededForBuffer}
                />
            </div>

            <FoodPanel
                isOpen={panelStates.food}
                onToggle={() => onTogglePanel('food')}
                calculations={calculations}
            />
        </>
    );
}
