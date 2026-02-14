import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');

/**
 * Load JSON data safely using absolute paths.
 * Prevents ERR_MODULE_NOT_FOUND issues on production environments.
 */
export function loadJson(filename) {
    try {
        const filePath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filePath)) {
            logger.error(`[DataLoader] CRITICAL: File not found at ${filePath}. Bot will have empty data.`);
            return {};
        }
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        console.error(`[DataLoader] Error loading ${filename}:`, error);
        return {};
    }
}

// Pre-loaded data for easy access
export const creatures = loadJson('creatures.json');
export const foods = loadJson('foods.json');
export const foodLists = loadJson('foodLists.json');

console.log(`[DataLoader] Loaded ${Object.keys(creatures).length} creatures, ${Object.keys(foods).length} foods, ${Object.keys(foodLists).length} diet lists.`);

