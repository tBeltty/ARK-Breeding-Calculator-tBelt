/**
 * Creature Icon Path Utility
 * 
 * Maps creature names to their corresponding icon filenames.
 * Some creatures have different names on the wiki than in our data.
 */

// Creatures with different wiki names
const ICON_NAME_MAPPINGS = {
    'Araneo': 'Spider',
    'Castoroides': 'Giant_Beaver',
    'Compsognathus': 'Compy',
    'Dilophosaurus': 'Dilophosaur',
    'Direbear': 'Dire_Bear',
    'Gasbag': 'Gasbags',
    'Onychonycteris': 'Onyc',
    'Pachycephalosaurus': 'Pachy',
    'Parasaurolophus': 'Parasaur',
    'Plesiosaurus': 'Plesiosaur',
    'Pulmonoscorpius': 'Scorpion',
    'Quetzalcoatlus': 'Quetzal',
    'Sarcosuchus': 'Sarco',
    'Spinosaurus': 'Spino',
    'Therizinosaurus': 'Therizinosaur',
    'Triceratops': 'Trike',
    'Woolly Rhino': 'Woolly_Rhinoceros',
    'Ferox (Large)': 'Ferox',
};

/**
 * Get the icon path for a creature
 * @param {string} creatureName - The creature name from our data
 * @returns {string} The path to the creature's icon
 */
export const getCreatureIcon = (_creatureName) => {
    // Use mapping if exists, otherwise use original name with spaces replaced
    const iconName = ICON_NAME_MAPPINGS[_creatureName] || _creatureName.replace(/ /g, '_');
    return `/creatures/${iconName}.png`;
}

/**
 * Check if a creature has an available icon
 * @param {string} creatureName - The creature name
 * @returns {boolean} True if icon likely exists
 */
export function hasCreatureIcon(_creatureName) {
    // All creatures in our data should have icons
    return true;
}
