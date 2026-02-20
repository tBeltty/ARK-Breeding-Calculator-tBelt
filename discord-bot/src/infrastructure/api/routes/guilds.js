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

// Simple in-memory cache for user guilds to avoid Discord 429s
const guildCache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

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
/**
 * Check if a user has permission to manage trackers in a guild
 */
async function checkTrackerPermission(userId, guildId, client, guildSettings) {
    // Default to true if no restrictions
    if (!guildSettings.command_restrictions) return true;

    try {
        const restrictions = JSON.parse(guildSettings.command_restrictions);

        // Handle legacy format (simple array of roles or channels?) 
        // OR new format: { "track": { roles: [], channels: [] } }
        // For /track command specifically:
        const trackRules = restrictions['track'] || restrictions['server-track'];

        // If no specific rules for 'track', allow.
        if (!trackRules) return true;

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return false;

        const member = await guild.members.fetch(userId);
        if (member.permissions.has('ManageGuild')) return true;

        // Check Role Permissions
        if (trackRules.roles && trackRules.roles.length > 0) {
            const hasRole = member.roles.cache.some(r => trackRules.roles.includes(r.id));
            if (!hasRole) return false;
        }

        return true;
        // Note: Channel permission is checked at the request level (channelId param), 
        // but here we are authorizing the USER action. 
    } catch (e) {
        console.error('Permission check error:', e);
        return false;
    }
}

// ... permissions helper ...
/**
 * Check if user is admin of the guild
 */
async function isGuildAdmin(userId, guildId, client) {
    if (!client) return false;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return false;

    try {
        const member = await guild.members.fetch(userId);
        return member.permissions.has('ManageGuild') || member.permissions.has('Administrator');
    } catch (e) {
        return false;
    }
}


// ... permissions helper ...

/**
 * GET /api/guilds
 * List all guilds where the user has Admin rights OR the bot is present.
 */
router.get('/', requireAuth, async (req, res) => {
    const userId = req.user.id;

    // Check cache
    const cached = guildCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        // logger.debug(`[API] Returning cached guilds for user ${userId}`);
        return res.json({ guilds: cached.data });
    }

    try {
        // 1. Fetch user's guilds from Discord
        const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: { Authorization: req.discordToken }
        });

        if (!response.ok) {
            // If we have stale cache, return it instead of erroring on 429
            if (response.status === 429 && cached) {
                logger.warn(`[API] Discord 429 for ${userId}, returning stale cache.`);
                return res.json({ guilds: cached.data });
            }

            logger.error(`[API] Failed to fetch user guilds: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({ error: 'Failed to fetch Discord guilds' });
        }

        const userGuilds = await response.json();
        const client = req.app.locals.client;

        if (!Array.isArray(userGuilds)) {
            logger.error('[API] Discord returned invalid guilds format');
            return res.json({ guilds: [] });
        }

        // logger.info(`[API] User ${req.user.id} returned ${userGuilds.length} raw guilds.`);

        const mutualGuilds = userGuilds
            .map(g => {
                const inServer = client.guilds.cache.has(g.id);
                // Check permissions directly from the Discord payload
                // 0x20 is MANAGE_GUILD, 0x8 is ADMINISTRATOR
                let isAdmin = false;
                try {
                    const p = BigInt(g.permissions || 0);
                    isAdmin = (p & 0x20n) === 0x20n || (p & 0x8n) === 0x8n;
                } catch (e) {
                    // ignore invalid permissions
                }
                const isOwner = g.owner === true;

                // Return if bot is in server OR user has permissions to invite/manage
                if (inServer || isAdmin || isOwner) {
                    const settings = inServer ? GuildRepository.findById(g.id) : null;
                    return {
                        id: g.id,
                        name: g.name,
                        icon: g.icon,
                        in_server: inServer,
                        isAdmin: isAdmin || isOwner,
                        tier: settings?.premium_tier || 'free'
                    };
                }
                return null;
            })
            .filter(Boolean)
            .sort((a, b) => (b.in_server ? 1 : 0) - (a.in_server ? 1 : 0)); // Sort: Bot In > Bot Out

        // Update cache
        guildCache.set(userId, {
            data: mutualGuilds,
            timestamp: Date.now()
        });

        res.json({ guilds: mutualGuilds });
    } catch (e) {
        logger.error('[API] Error in GET /api/guilds:', e);
        res.status(500).json({ error: 'Internal Server Error' });
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
    const isAdmin = await isGuildAdmin(req.user.id, id, client);

    // If admin, see all. If member, see only own.
    const creatures = isAdmin
        ? CreatureRepository.findActiveByGuild(id)
        : CreatureRepository.findActiveByUser(id, req.user.id);

    let channels = [];
    let roles = [];

    if (client) {
        const guild = client.guilds.cache.get(id);
        if (guild) {
            // Fetch Channels
            channels = guild.channels.cache
                .filter(c => [0, 5].includes(c.type) && c.permissionsFor(client.user)?.has(['SendMessages', 'ViewChannel']))
                .map(c => ({ id: c.id, name: c.name, position: c.position, type: c.type }))
                .sort((a, b) => a.position - b.position);

            // Fetch Roles (excluding @everyone and managed roles if possible, but for now just all non-managed)
            roles = guild.roles.cache
                .filter(r => r.name !== '@everyone' && !r.managed)
                .map(r => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position }))
                .sort((a, b) => b.position - a.position);
        }
    }

    res.json({ settings, creatures, channels, roles, isAdmin });
});

/**
 * PATCH /api/guilds/:id/settings
 */
router.patch('/:id/settings', requireAuth, async (req, res) => {
    const { id } = req.params;
    const client = req.app.locals.client;

    if (!await isGuildAdmin(req.user.id, id, client)) {
        return res.status(403).json({ error: 'Only administrators can change server settings.' });
    }

    const updates = req.body;
    const allowed = ['notify_mode', 'notify_channel_id', 'server_rates', 'game_version', 'alert_threshold', 'command_restrictions'];
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
        const isAdmin = await isGuildAdmin(req.user.id, guildId, client);
        const isOwner = creature.user_id === req.user.id;

        if (!isAdmin && !isOwner) {
            return res.status(403).json({ error: 'You do not have permission to stop this tracker.' });
        }

        CreatureRepository.stop(creatureId);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: 'Error' }); }
});

export default router;
