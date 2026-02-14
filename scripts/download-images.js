import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Creature image URLs (Research these URLs manually or via search if needed, but for now using placeholders to be replaced)
// Using known Wiki URLs or placeholders. I will use a search result if I can find one, otherwise I might need to ask the user or guess.
// Wait, I can use a search command to get the URLs first.
// Actually, I will create a script that TAKES arguments or has the URLs hardcoded.

const creatures = [
    { name: 'Elderclaw', url: 'https://ark.wiki.gg/images/thumb/a/a6/Elderclaw.png/300px-Elderclaw.png' }, // Example URL pattern
    { name: 'Megaraptor', url: 'https://ark.wiki.gg/images/thumb/c/c5/Megaraptor.png/300px-Megaraptor.png' },
    { name: 'Gigadesmodus', url: 'https://ark.wiki.gg/images/thumb/8/8f/Gigadesmodus.png/300px-Gigadesmodus.png' }
];

// NOTE: The above URLs are guesses based on standard Wiki patterns. If they fail, I'll need to find the real ones.

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, response => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else {
                fs.unlink(filepath, () => reject(`Failed to download ${url}: ${response.statusCode}`));
            }
        }).on('error', err => {
            fs.unlink(filepath, () => reject(err.message));
        });
    });
};

const run = async () => {
    const destDir = path.join(__dirname, '../public/creatures');
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Try to find the real URLs first using curl/grep if possible? No, that's complex.
    // I will try to download them. If they fail, I might need to use a more robust method or ask the user.
    // But wait, the user said "Del mismo modo que obtuviste las de todos los otros dinos".
    // I did NOT obtain the others. They were there.
    // Maybe the user implies I should have a script for this?

    // Attempting download:
    for (const creature of creatures) {
        const destPath = path.join(destDir, `${creature.name}.png`);
        console.log(`Downloading ${creature.name} to ${destPath}...`);
        try {
            await downloadImage(creature.url, destPath);
            console.log(`Downloaded ${creature.name}`);
        } catch (e) {
            console.error(`Error downloading ${creature.name}:`, e);
            // Fallback: try webp?
        }
    }
};

run();
