/**
 * Guilds API Routes
 */

import express from 'express';
import { GuildRepository } from '../../database/repositories/GuildRepository.js';
import { CreatureRepository } from '../../database/repositories/CreatureRepository.js';
import { logger } from '../../../shared/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_SETTINGS, calculateMaturationTime, calculateBufferTime } from '../../../domain/breeding.js';
import { createCreatureEmbed } from '../../../shared/embeds.js';
import { rateLimitMiddleware } from '../middleware/rateLimiter.js';

// Load creatures and foods data
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const creatures = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../data/creatures.json'), 'utf8'));
const foods = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../data/foods.json'), 'utf8'));

const router = express.Router();

/**
 * Middleware: requireAuth
 * Verifies Discord token and gets user info
 */
const requireAuth = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    req.discordToken = authHeader;

    try {
        const response = await fetch('https://discord.com/api/v10/users/@me', {
            headers: { Authorization: authHeader }
        });

        if (!response.ok) return res.status(401).json({ error: 'Invalid or expired token' });
        req.user = await response.json();
        next();
    } catch (error) {
        logger.error('Auth Middleware Error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
};

/**
 * Check if a user has permission to manage trackers in a guild
 */
async function checkTrackerPermission(userId, guildId, client, guildSettings) {
    if (!guildSettings.command_restrictions) return true;
    try {
        const allowedRoles = JSON.parse(guildSettings.command_restrictions);
        if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) return true;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return false;

        const member = await guild.members.fetch(userId);
        if (member.permissions.has('ManageGuild')) return true;

        return member.roles.cache.some(role => allowedRoles.includes(role.id));
    } catch (e) { return false; }
}

/**
 * Helper to check if user is admin in a guild
 */
function isGuildAdmin(userId, guildId, client) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return false;
    const member = guild.members.cache.get(userId);
    return member?.permissions.has('ManageGuild') || false;
}

// Global API rate limit
router.use(rateLimitMiddleware(60, 60));

/**
 * GET /api/guilds
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: { Authorization: req.discordToken }
        });
        if (!response.ok) return res.status(response.status).json({ error: 'Failed' });

        const userGuilds = await response.json();
        const client = req.app.locals.client;

        // --- Tier Identification Logic ---
        let userTier = 'free';
        const supportServerId = process.env.SUPPORT_SERVER_ID;
        const proRoleId = process.env.PRO_ROLE_ID;
        const tribeRoleId = process.env.TRIBE_ROLE_ID;

        if (client && supportServerId) {
            try {
                const supportGuild = client.guilds.cache.get(supportServerId);
                if (supportGuild) {
                    const member = await supportGuild.members.fetch(req.user.id);
                    if (member) {
                        if (tribeRoleId && member.roles.cache.has(tribeRoleId)) userTier = 'tribe';
                        else if (proRoleId && member.roles.cache.has(proRoleId)) userTier = 'pro';
                    }
                }
            } catch (e) { /* ignore */ }
        }
        // ---------------------------------

        const mutualGuilds = userGuilds
            .map(g => {
                const inServer = client.guilds.cache.has(g.id);
                if (!inServer) return null; // Only servers where bot is present

                const settings = GuildRepository.findById(g.id);
                const isAdmin = (BigInt(g.permissions) & 0x20n) === 0x20n;

                return {
                    id: g.id,
                    name: g.name,
                    icon: g.icon,
                    in_server: true,
                    isAdmin: isAdmin,
                    tier: settings?.premium_tier || 'free'
                };
            })
            .filter(Boolean)
            .sort((a, b) => (b.isAdmin ? 1 : 0) - (a.isAdmin ? 1 : 0));

        res.json({ user_tier: userTier, guilds: mutualGuilds });
    } catch (error) {
        logger.error('API Error /guilds:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/guilds/:id
 */
router.get('/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const settings = GuildRepository.findById(id);
    if (!settings) return res.status(404).json({ error: 'Not found' });

    const client = req.app.locals.client;
    const isAdmin = isGuildAdmin(req.user.id, id, client);

    // If admin, see all. If member, see only own.
    const creatures = isAdmin
        ? CreatureRepository.findActiveByGuild(id)
        : CreatureRepository.findActiveByUser(id, req.user.id);

    let channels = [];
    if (client) {
        const guild = client.guilds.cache.get(id);
        if (guild) {
            channels = guild.channels.cache
                .filter(c => c.type === 0 && c.permissionsFor(client.user)?.has(['SendMessages', 'EmbedLinks']))
                .map(c => ({ id: c.id, name: c.name, position: c.position }))
                .sort((a, b) => a.position - b.position);
        }
    }

    res.json({ settings, creatures, channels, isAdmin });
});

/**
 * PATCH /api/guilds/:id/settings
 */
router.patch('/:id/settings', requireAuth, async (req, res) => {
    const { id } = req.params;
    const client = req.app.locals.client;

    if (!isGuildAdmin(req.user.id, id, client)) {
        return res.status(403).json({ error: 'Only administrators can change server settings.' });
    }

    const updates = req.body;
    const allowed = ['notify_mode', 'server_rates', 'game_version', 'alert_threshold', 'command_restrictions'];
    const filtered = Object.keys(updates).filter(k => allowed.includes(k)).reduce((o, k) => ({ ...o, [k]: updates[k] }), {});

    try {
        GuildRepository.updateSettings(id, filtered);
        res.json({ success: true, settings: GuildRepository.findById(id) });
    } catch (e) { res.status(500).json({ error: 'Failed' }); }
});

/**
 * POST /api/guilds/:id/commands/track
 */
router.post('/:id/commands/track', requireAuth, rateLimitMiddleware(5, 60), async (req, res) => {
    const { id } = req.params;
    const { creature, nickname, progress = 0, weight, channelId, notifyMode, notifyChannelId } = req.body;
    const client = req.app.locals.client;

    try {
        const creatureData = creatures[creature];
        const guildSettings = GuildRepository.findById(id);
        if (!creatureData || !guildSettings) return res.status(400).json({ error: 'Invalid data' });

        if (!await checkTrackerPermission(req.user.id, id, client, guildSettings)) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        if (!CreatureRepository.canAddCreature(id, guildSettings.premium_tier)) {
            return res.status(403).json({ error: 'Limit reached' });
        }

        const settings = { ...DEFAULT_SETTINGS, maturationSpeed: guildSettings.server_rates || 1 };
        const totalMatSeconds = calculateMaturationTime(creatureData, settings);
        const maturationMs = totalMatSeconds * ((100 - progress) / 100) * 1000;
        const matureTime = new Date(Date.now() + maturationMs);

        const tracked = CreatureRepository.create({
            guildId: id, userId: req.user.id, creatureType: creature,
            nickname: nickname || null, startTime: new Date().toISOString(),
            matureTime: matureTime.toISOString(), weight: weight || creatureData.weight,
            notifyMode, notifyChannelId
        });

        if (client && channelId) {
            const channel = client.channels.cache.get(channelId);
            if (channel && channel.permissionsFor(client.user)?.has(['SendMessages', 'EmbedLinks'])) {
                const foodName = creatureData.type === 'Herbivore' ? 'Mejoberry' : 'Raw Meat';
                const capacity = Math.floor(((weight || creatureData.weight) * (progress / 100)) / foods[foodName].weight);
                const bufferSeconds = calculateBufferTime(capacity, foods[foodName], creatureData, progress / 100, settings);
                const embed = createCreatureEmbed(tracked, { percentage: progress, remainingMs: maturationMs, bufferMinutes: Math.floor(bufferSeconds / 60) });
                channel.send({ embeds: [embed] }).catch(() => { });
            }
        }
        res.json({ success: true, creature: tracked });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

/**
 * POST /api/guilds/:id/creatures/:creatureId/stop
 */
router.post('/:id/creatures/:creatureId/stop', requireAuth, async (req, res) => {
    const { creatureId, id: guildId } = req.params;
    const client = req.app.locals.client;

    try {
        const creature = CreatureRepository.findById(creatureId);
        if (!creature) return res.status(404).json({ error: 'Creature not found' });

        // Security check: must be admin OR owner
        const isAdmin = isGuildAdmin(req.user.id, guildId, client);
        const isOwner = creature.user_id === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'You do not have permission to stop this tracker.' });
        }

        CreatureRepository.stop(creatureId);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

export default router;
