/**
 * Lightweight i18n helper for the Discord bot.
 * Resolves strings by guild locale (stored in DB).
 * 
 * Usage:
 *   import { t, getLocale } from '../shared/i18n.js';
 *   const locale = getLocale(interaction.guildId);
 *   await interaction.reply(t(locale, 'track.success', { name: 'Rex' }));
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GuildRepository } from '../infrastructure/database/repositories/GuildRepository.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const locales = {
    en: JSON.parse(readFileSync(join(__dirname, 'locales', 'en.json'), 'utf8')),
    es: JSON.parse(readFileSync(join(__dirname, 'locales', 'es.json'), 'utf8')),
};

/**
 * Get the locale for a guild from the database.
 * Falls back to 'en' if not set.
 */
export function getLocale(guildId) {
    try {
        const guild = GuildRepository.findOrCreate(guildId);
        return guild.locale || 'en';
    } catch {
        return 'en';
    }
}

/**
 * Get a nested value from an object using a dot-separated key.
 */
function getNestedValue(obj, key) {
    return key.split('.').reduce((o, k) => o?.[k], obj);
}

/**
 * Translate a key for a given locale, with optional interpolation.
 * 
 * @param {string} locale - 'en' or 'es'
 * @param {string} key - Dot-separated key (e.g., 'track.success')
 * @param {object} params - Optional interpolation values: { name: 'Rex' } replaces {{name}}
 * @returns {string} Translated string, or the English fallback, or the key itself.
 */
export function t(locale, key, params = {}) {
    let str = getNestedValue(locales[locale], key)
        || getNestedValue(locales.en, key)
        || key;

    // Interpolate {{param}} placeholders
    for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
    }

    return str;
}
