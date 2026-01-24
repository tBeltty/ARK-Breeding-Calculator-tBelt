/**
 * Notification Scheduler
 * 
 * Runs periodically to check for creatures needing alerts.
 * Uses node-cron for scheduling.
 */

import cron from 'node-cron';
import { CreatureRepository } from '../infrastructure/database/repositories/CreatureRepository.js';
import { createWarningEmbed, createSuccessEmbed } from '../shared/embeds.js';
import { logger } from '../shared/logger.js';

let discordClient = null;

/**
 * Start the notification scheduler
 */
export function startNotificationScheduler(client) {
    discordClient = client;

    // Run every minute
    cron.schedule('* * * * *', async () => {
        await checkAndSendNotifications();
    });

    // Cleanup old data every hour
    cron.schedule('0 * * * *', () => {
        const deleted = CreatureRepository.cleanup();
        if (deleted > 0) {
            logger.info(`Cleaned up ${deleted} old creature records`);
        }
    });

    logger.success('Notification scheduler started');
}

/**
 * Check for creatures needing alerts and send notifications
 */
async function checkAndSendNotifications() {
    try {
        const creatures = CreatureRepository.getCreaturesNeedingAlert();

        if (creatures.length === 0) return;

        logger.debug(`Processing ${creatures.length} notification(s)`);

        for (const creature of creatures) {
            await sendNotification(creature);
        }
    } catch (error) {
        logger.error('Error in notification scheduler:', error);
    }
}

/**
 * Send notification for a single creature
 */
async function sendNotification(creature) {
    try {
        const now = Date.now();
        const matureTime = new Date(creature.mature_time).getTime();
        const remainingMs = matureTime - now;

        // Creature is mature
        if (remainingMs <= 0) {
            await sendMatureNotification(creature);
            CreatureRepository.updateStatus(creature.id, 'mature');
            return;
        }

        // Buffer warning
        await sendBufferWarning(creature, remainingMs);
        CreatureRepository.markNotified(creature.id);
    } catch (error) {
        logger.error(`Failed to send notification for creature ${creature.id}:`, error);
    }
}

/**
 * Send a mature notification
 */
async function sendMatureNotification(creature) {
    const embed = createSuccessEmbed(
        'Creature Fully Mature!',
        `🎉 **${creature.nickname || creature.creature_type}** has reached 100% maturation!`
    );

    await deliverNotification(creature, embed);
}

/**
 * Send a buffer warning notification
 */
async function sendBufferWarning(creature, remainingMs) {
    const minutes = Math.floor(remainingMs / 60000);

    const embed = createWarningEmbed(
        'Low Buffer Warning!',
        `⏰ **${creature.nickname || creature.creature_type}** needs attention!\n` +
        `Time remaining: **${minutes} minutes**`
    );

    await deliverNotification(creature, embed);
}

/**
 * Deliver notification via DM or channel
 */
async function deliverNotification(creature, embed) {
    if (!discordClient) return;

    try {
        if (creature.notify_mode === 'dm') {
            // Send via DM to the user who created the tracking
            const user = await discordClient.users.fetch(creature.user_id);
            await user.send({ embeds: [embed] });
        } else if (creature.notify_mode === 'channel' && creature.notify_channel_id) {
            // Send to configured channel
            const channel = await discordClient.channels.fetch(creature.notify_channel_id);
            await channel.send({
                content: `<@${creature.user_id}>`,
                embeds: [embed]
            });
        }
    } catch (error) {
        logger.warn(`Could not deliver notification for creature ${creature.id}:`, error.message);
    }
}
