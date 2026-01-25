import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../../shared/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class LocalizationService {
    constructor() {
        this.locales = {};
        this.defaultLocale = 'en';
        this.loaded = false;
    }

    load() {
        try {
            const localesPath = path.join(__dirname, '../../locales');
            if (!fs.existsSync(localesPath)) {
                logger.warn('Locales directory not found at:', localesPath);
                return;
            }

            const files = fs.readdirSync(localesPath).filter(f => f.endsWith('.json'));
            for (const file of files) {
                const localeCode = path.basename(file, '.json');
                const content = fs.readFileSync(path.join(localesPath, file), 'utf-8');
                this.locales[localeCode] = JSON.parse(content);
                logger.debug(`Loaded locale: ${localeCode}`);
            }
            this.loaded = true;
            logger.info(`LocalizationService loaded ${Object.keys(this.locales).length} languages.`);
        } catch (error) {
            logger.error('Failed to load locales:', error);
        }
    }

    /**
     * Get a translation
     * @param {string} key - Dot notation key (e.g. 'notifications.server_back_online')
     * @param {string} locale - Locale code (e.g. 'es', 'en')
     * @param {object} replacements - Key-value pairs for replacement (e.g. { name: 'Server1' })
     */
    t(key, locale = 'en', replacements = {}) {
        if (!this.loaded) this.load();

        // Fallback to default if locale not found
        const targetLocale = this.locales[locale] ? locale : this.defaultLocale;
        let template = this._getDeep(this.locales[targetLocale], key);

        // Fallback to default language if key missing in target
        if (!template && targetLocale !== this.defaultLocale) {
            template = this._getDeep(this.locales[this.defaultLocale], key);
        }

        if (!template) return key; // Return key if translation completely missing

        // Replace placeholders {{key}}
        return template.replace(/\{\{(\w+)\}\}/g, (_, k) => {
            return replacements[k] !== undefined ? replacements[k] : `{{${k}}}`;
        });
    }

    _getDeep(obj, path) {
        return path.split('.').reduce((o, i) => (o ? o[i] : null), obj);
    }
}

export const localization = new LocalizationService();
