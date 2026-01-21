#!/usr/bin/env node
/**
 * Download Creature Icons from ARK Wiki
 * 
 * Downloads creature icon images from the ARK Official Wiki (wiki.gg)
 * and saves them to public/creatures/ directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load creatures from data file
const creaturesPath = path.join(__dirname, 'src/data/creatures.json');
const creatures = JSON.parse(fs.readFileSync(creaturesPath, 'utf8'));
const creatureNames = Object.keys(creatures);

// Output directory
const outputDir = path.join(__dirname, 'public/creatures');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// ARK Wiki base URL for creature icons
const WIKI_BASE = 'https://ark.wiki.gg/images';

// Some creatures have different wiki names
const NAME_MAPPINGS = {
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

// Download a single image
function downloadImage(creatureName) {
    return new Promise((resolve, reject) => {
        // Use mapping if exists, otherwise use original name
        const wikiName = NAME_MAPPINGS[creatureName] || creatureName;

        // Format for wiki: replace spaces with underscores
        const formattedName = wikiName.replace(/ /g, '_');
        const url = `${WIKI_BASE}/${formattedName}.png`;
        const outputPath = path.join(outputDir, `${formattedName}.png`);

        // Skip if already exists
        if (fs.existsSync(outputPath)) {
            console.log(`⏭️  Skipping ${creatureName} (already exists)`);
            resolve({ name: creatureName, status: 'skipped' });
            return;
        }

        console.log(`📥 Downloading ${creatureName}...`);

        const file = fs.createWriteStream(outputPath);

        // Request options with User-Agent to avoid 403
        const requestUrl = new URL(url);
        const options = {
            hostname: requestUrl.hostname,
            path: requestUrl.pathname,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/png,image/*,*/*',
                'Referer': 'https://ark.wiki.gg/'
            }
        };

        https.get(options, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = new URL(response.headers.location);
                const redirectOptions = {
                    hostname: redirectUrl.hostname,
                    path: redirectUrl.pathname,
                    headers: options.headers
                };
                https.get(redirectOptions, (redirectResponse) => {
                    if (redirectResponse.statusCode === 200) {
                        redirectResponse.pipe(file);
                        file.on('finish', () => {
                            file.close();
                            console.log(`✅ ${creatureName}`);
                            resolve({ name: creatureName, status: 'success' });
                        });
                    } else {
                        file.close();
                        fs.unlinkSync(outputPath);
                        console.log(`❌ ${creatureName} (HTTP ${redirectResponse.statusCode})`);
                        resolve({ name: creatureName, status: 'failed', code: redirectResponse.statusCode });
                    }
                });
                return;
            }

            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`✅ ${creatureName}`);
                    resolve({ name: creatureName, status: 'success' });
                });
            } else {
                file.close();
                fs.unlinkSync(outputPath);
                console.log(`❌ ${creatureName} (HTTP ${response.statusCode})`);
                resolve({ name: creatureName, status: 'failed', code: response.statusCode });
            }
        }).on('error', (err) => {
            file.close();
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
            console.log(`❌ ${creatureName} (${err.message})`);
            resolve({ name: creatureName, status: 'error', error: err.message });
        });
    });
}

// Add delay between requests to be nice to the server
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('🦖 ARK Creature Icon Downloader');
    console.log(`📊 ${creatureNames.length} creatures to process`);
    console.log(`📁 Output: ${outputDir}\n`);

    const results = {
        success: [],
        skipped: [],
        failed: []
    };

    for (const name of creatureNames) {
        const result = await downloadImage(name);

        if (result.status === 'success') results.success.push(name);
        else if (result.status === 'skipped') results.skipped.push(name);
        else results.failed.push(name);

        // Be nice to the server - wait 200ms between requests
        await delay(200);
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Downloaded: ${results.success.length}`);
    console.log(`   ⏭️  Skipped: ${results.skipped.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);

    if (results.failed.length > 0) {
        console.log('\n❌ Failed creatures:');
        results.failed.forEach(name => console.log(`   - ${name}`));
    }

    // Calculate total size
    let totalSize = 0;
    const files = fs.readdirSync(outputDir);
    files.forEach(file => {
        const stats = fs.statSync(path.join(outputDir, file));
        totalSize += stats.size;
    });
    console.log(`\n💾 Total size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(console.error);
