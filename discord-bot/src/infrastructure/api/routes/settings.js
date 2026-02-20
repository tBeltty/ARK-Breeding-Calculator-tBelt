/**
 * Global Bot Settings Routes
 */

import express from 'express';
import { SettingsRepository } from '../../database/repositories/SettingsRepository.js';
import { logger } from '../../../shared/logger.js';

const router = express.Router();

/**
 * GET /api/settings
 * List all global settings
 */
router.get('/', async (req, res) => {
    try {
        const settings = SettingsRepository.listAll();
        // Convert array to object for easier consumption
        const settingsObj = settings.reduce((acc, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(settingsObj);
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

/**
 * PATCH /api/settings
 * Update global settings
 */
router.patch('/', async (req, res) => {
    const updates = req.body;
    if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Invalid update payload' });
    }

    try {
        for (const [key, value] of Object.entries(updates)) {
            // Validate key naming (basic prevention of garbage injection)
            if (/^[a-z0-9_]+$/.test(key)) {
                SettingsRepository.set(key, String(value));
            }
        }
        res.json({ success: true });
    } catch (e) {
        logger.error('Failed to update global settings:', e);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;
