/**
 * Common ARK Creature Nicknames/Abbreviations
 * Used to populate default names for better UI fit.
 */
export const CREATURE_NICKNAMES = {
    // Requested
    'Triceratops': 'Trike',
    'Carcharodontosaurus': 'Carcha',
    'Giganotosaurus': 'Giga',
    'Brontosaurus': 'Bronto',
    'Pachycephalosaurus': 'Pachy',

    // Common
    'Tyrannosaurus': 'Rex',
    'Argentavis': 'Argy',
    'Stegosaurus': 'Stego',
    'Spinosaurus': 'Spino',
    'Parasaurolophus': 'Para',
    'Pteranodon': 'Ptera',
    'Quetzalcoatlus': 'Quetz',
    'Ankylosaurus': 'Anky',
    'Doedicurus': 'Doedic',
    'Thylacoleo': 'Thyla',
    'Yutyrannus': 'Yuty',
    'Desmodus': 'Desmo',
    'Deinonychus': 'Deino',
    'Mosasaurus': 'Mosa',
    'Tusoteuthis': 'Tuso',
    'Basilosaurus': 'Basi',
    'Woolly Rhino': 'Rhino',
    'Direwolf': 'Wolf',
    'Direbear': 'Bear',
    'Sabertooth': 'Saber',
    'Beelzebufo': 'Frog',
    'Megalodon': 'Shark',
    'Kairuku': 'Penguin',
    'Equus': 'Horse',
    'Ovis': 'Sheep',
    'Tapejara': 'Tape',
    'Therizinosaurus': 'Theri',
    'Velonasaur': 'Velo',
    'Procoptodon': 'Roo',
    'Paraceratherium': 'Paracer',
    'Megatherium': 'Sloth',
    'Daeodon': 'Pig',
    'Iguanodon': 'Iggy',
    'Castoroides': 'Beaver',
    'Carbonemys': 'Turtle',
    'Baryonyx': 'Bary',
    'Achatina': 'Snail',
    'Allosaurus': 'Allo',
    'Carnotaurus': 'Carno',
    'Diplodocus': 'Diplo',
    'Gallimimus': 'Galli',
    'Hesperornis': 'Duck',
    'Ichthyosaurus': 'Dolphin',
    'Kaprosuchus': 'Kapro',
    'Megaloceros': 'Elk',
    'Megalosaurus': 'Megalo',
    'Otter': 'Otter',
    'Oviraptor': 'Ovi',
    'Pelagornis': 'Pela',
    'Phiomia': 'Phio',
    'Sarcosuchus': 'Sarco',
    'Troodon': 'Troo'
};

/**
 * Get the nickname for a creature, or return the original name if none exists.
 * @param {string} creatureName 
 * @returns {string}
 */
export const getNickname = (creatureName) => {
    return CREATURE_NICKNAMES[creatureName] || creatureName;
};
