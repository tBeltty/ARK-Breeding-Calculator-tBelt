/**
 * Setup Bot Profile Script
 * 
 * Sets the bot's avatar and updates its presence.
 * Run once: node scripts/setup-profile.js
 */

import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function setupBotProfile() {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    // Read bot icon file and convert to base64
    const botIconPath = path.join(__dirname, '../bot.png');
    const iconBuffer = fs.readFileSync(botIconPath);
    const iconBase64 = `data:image/png;base64,${iconBuffer.toString('base64')}`;

    console.log('🎨 Setting bot avatar...');

    try {
        // Update bot user (avatar)
        await rest.patch(Routes.user('@me'), {
            body: {
                avatar: iconBase64,
            },
        });
        console.log('✅ Bot avatar updated successfully!');
    } catch (error) {
        console.error('❌ Failed to update bot avatar:', error.message);
    }

    // Update the Application icon (App Icon in Developer Portal)
    console.log('🖼️ Setting application icon...');

    try {
        await rest.patch(Routes.currentApplication(), {
            body: {
                icon: iconBase64,
            },
        });
        console.log('✅ Application icon updated!');
    } catch (error) {
        console.error('❌ Failed to update app icon:', error.message);
    }

    // Also update the Application info via Discord API
    console.log('📝 Updating application description...');

    try {
        await rest.patch(Routes.currentApplication(), {
            body: {
                description: 'Your ultimate ARK: Survival Ascended & Evolved breeding companion! Track baby creatures, calculate trough requirements, and get real-time maturation alerts. Built by tBelt.',
                tags: ['ark', 'breeding', 'calculator', 'gaming', 'dinosaurs'],
            },
        });
        console.log('✅ Application description updated!');
    } catch (error) {
        console.error('❌ Failed to update description:', error.message);
    }

    console.log('\n🎉 Bot profile setup complete!');
}

setupBotProfile();
