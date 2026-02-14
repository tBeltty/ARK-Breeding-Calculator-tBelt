import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath = path.join(__dirname, '../src/data/creatures.json');
const destPath = path.join(__dirname, '../discord-bot/src/data/creatures.json');

try {
    const sourceData = fs.readFileSync(sourcePath, 'utf8');
    // Ensure destination directory exists
    const destDir = path.dirname(destPath);
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    fs.writeFileSync(destPath, sourceData);
    console.log(`Successfully synced creatures.json from src to discord-bot.`);
} catch (error) {
    console.error('Error syncing creatures.json:', error);
    process.exit(1);
}
