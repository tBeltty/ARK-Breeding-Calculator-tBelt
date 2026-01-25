/**
 * /settings Command
 * 
 * View and configure server settings.
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { GuildRepository } from '../../database/repositories/GuildRepository.js';
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from '../../../shared/embeds.js';

export const data = new SlashCommandBuilder()
    .setName('settings')
    .setNameLocalizations({ 'es-ES': 'ajustes' })
    .setDescription('View or configure server settings')
    .setDescriptionLocalizations({ 'es-ES': 'Ver o configurar ajustes del servidor' })
    .addSubcommand(subcommand =>
        subcommand
            .setName('view')
            .setNameLocalizations({ 'es-ES': 'ver' })
            .setDescription('View current server settings')
            .setDescriptionLocalizations({ 'es-ES': 'Ver configuración actual del servidor' })
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('game')
            .setNameLocalizations({ 'es-ES': 'juego' })
            .setDescription('Set game version (ASE or ASA)')
            .setDescriptionLocalizations({ 'es-ES': 'Establecer versión del juego (ASE o ASA)' })
            .addStringOption(option =>
                option
                    .setName('version')
                    .setNameLocalizations({ 'es-ES': 'version' })
                    .setDescription('Game version')
                    .setDescriptionLocalizations({ 'es-ES': 'Versión del juego' })
                    .setRequired(true)
                    .addChoices(
                        { name: 'ARK: Survival Ascended', value: 'ASA' },
                        { name: 'ARK: Survival Evolved', value: 'ASE' }
                    )
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('rates')
            .setNameLocalizations({ 'es-ES': 'tasas' })
            .setDescription('Set server maturation rates')
            .setDescriptionLocalizations({ 'es-ES': 'Configurar tasas de maduración del servidor' })
            .addStringOption(option =>
                option
                    .setName('mode')
                    .setNameLocalizations({ 'es-ES': 'modo' })
                    .setDescription('Rate mode: Official (Auto) or Custom (Manual)')
                    .setDescriptionLocalizations({ 'es-ES': 'Modo de tasas: Oficial (Auto) o Personalizado (Manual)' })
                    .setRequired(true)
                    .addChoices(
                        { name: 'Official (Auto-Sync)', value: 'official' },
                        { name: 'Custom (Manual)', value: 'custom' }
                    )
            )
            .addNumberOption(option =>
                option
                    .setName('multiplier')
                    .setNameLocalizations({ 'es-ES': 'multiplicador' })
                    .setDescription('Rate multiplier (only for Custom mode)')
                    .setDescriptionLocalizations({ 'es-ES': 'Multiplicador de tasas (solo modo Personalizado)' })
                    .setRequired(false)
                    .setMinValue(0.1)
                    .setMaxValue(100)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('notify')
            .setNameLocalizations({ 'es-ES': 'notificaciones' })
            .setDescription('Configure notification preferences')
            .setDescriptionLocalizations({ 'es-ES': 'Configurar preferencias de notificación' })
            .addStringOption(option =>
                option
                    .setName('mode')
                    .setNameLocalizations({ 'es-ES': 'modo' })
                    .setDescription('Notification mode')
                    .setDescriptionLocalizations({ 'es-ES': 'Modo de notificación' })
                    .setRequired(true)
                    .addChoices(
                        { name: 'Send to channel', value: 'channel' },
                        { name: 'Send DM to user', value: 'dm' },
                        { name: 'Disabled', value: 'off' }
                    )
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('channel')
            .setNameLocalizations({ 'es-ES': 'canal' })
            .setDescription('Set notification channel')
            .setDescriptionLocalizations({ 'es-ES': 'Establecer canal de notificaciones' })
            .addChannelOption(option =>
                option
                    .setName('target')
                    .setNameLocalizations({ 'es-ES': 'destino' })
                    .setDescription('The channel for notifications')
                    .setDescriptionLocalizations({ 'es-ES': 'El canal para recibir notificaciones' })
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('language')
            .setNameLocalizations({ 'es-ES': 'idioma' })
            .setDescription('Set bot language for this server')
            .setDescriptionLocalizations({ 'es-ES': 'Establecer idioma del bot para este servidor' })
            .addStringOption(option =>
                option
                    .setName('locale')
                    .setNameLocalizations({ 'es-ES': 'codigo' })
                    .setDescription('Language code')
                    .setDescriptionLocalizations({ 'es-ES': 'Código de idioma' })
                    .setRequired(true)
                    .addChoices(
                        { name: 'English', value: 'en' },
                        { name: 'Español', value: 'es' }
                    )
            )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
    const { checkCommandPermission } = await import('../security/permissionCheck.js');
    if (!checkCommandPermission(interaction, 'settings')) {
        return interaction.reply({ content: '⛔ You do not have permission to use this command here.', ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const guild = GuildRepository.findOrCreate(interaction.guildId);

    switch (subcommand) {
        case 'view':
            await handleView(interaction, guild);
            break;
        case 'game':
            await handleGame(interaction, guild);
            break;
        case 'rates':
            await handleRates(interaction, guild);
            break;
        case 'notify':
            await handleNotify(interaction, guild);
            break;
        case 'channel':
            await handleChannel(interaction, guild);
            break;
        case 'language':
            await handleLanguage(interaction, guild);
            break;
    }
}

async function handleView(interaction, guild) {
    const embed = new EmbedBuilder()
        .setColor(0x6366F1)
        .setTitle('⚙️ Server Settings')
        .addFields(
            { name: '🎮 Game Version', value: guild.game_version || 'ASA', inline: true },
            { name: '📈 Server Rates', value: `${guild.server_rates || 1}x`, inline: true },
            { name: '🔔 Notifications', value: guild.notify_mode || 'channel', inline: true },
            { name: '📢 Notify Channel', value: guild.notify_channel_id ? `<#${guild.notify_channel_id}>` : 'Not set', inline: true },
            { name: '🌐 Language', value: guild.locale === 'es' ? 'Español' : 'English', inline: true },
            { name: '⏰ Alert Threshold', value: `${guild.alert_threshold || 5} min`, inline: true },
            { name: '💎 Tier', value: (guild.premium_tier || 'free').toUpperCase(), inline: true },
        )
        .setFooter({ text: 'Use /settings <option> to change settings' })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleGame(interaction, guild) {
    const version = interaction.options.getString('version');

    GuildRepository.updateSettings(interaction.guildId, { game_version: version });

    await interaction.reply({
        embeds: [createSuccessEmbed('Game Version Updated', `Now using **${version}** settings.`)],
    });
}

async function handleRates(interaction, guild) {
    const mode = interaction.options.getString('mode');
    const multiplier = interaction.options.getNumber('multiplier');

    if (mode === 'custom' && !multiplier) {
        await interaction.reply({
            embeds: [createErrorEmbed('Input Error', 'You must provide a `multiplier` when using **Custom** mode.')],
            ephemeral: true
        });
        return;
    }

    const updates = {
        auto_rates: mode === 'official' ? 1 : 0
    };

    if (mode === 'custom') {
        updates.server_rates = multiplier;
    }

    GuildRepository.updateSettings(interaction.guildId, updates);

    const message = mode === 'official'
        ? 'Now automatically syncing with **Official ARK Rates**.'
        : `Rates set to manual **${multiplier}x** multiplier.`;

    await interaction.reply({
        embeds: [createSuccessEmbed('Server Rates Updated', message)],
    });
}

async function handleNotify(interaction, guild) {
    const mode = interaction.options.getString('mode');

    GuildRepository.updateSettings(interaction.guildId, { notify_mode: mode });

    const modeLabels = {
        channel: 'notifications will be sent to the configured channel',
        dm: 'notifications will be sent via DM to the creature owner',
        off: 'notifications are disabled',
    };

    await interaction.reply({
        embeds: [createSuccessEmbed('Notification Mode Updated', `Now ${modeLabels[mode]}.`)],
    });
}

async function handleChannel(interaction, guild) {
    const channel = interaction.options.getChannel('target');

    GuildRepository.updateSettings(interaction.guildId, { notify_channel_id: channel.id });

    await interaction.reply({
        embeds: [createSuccessEmbed('Notification Channel Set', `Notifications will be sent to ${channel}.`)],
    });
}

async function handleLanguage(interaction, guild) {
    const locale = interaction.options.getString('locale');

    GuildRepository.updateSettings(interaction.guildId, { locale });

    const messages = {
        en: `Bot language set to **English**.`,
        es: `Idioma del bot cambiado a **Español**.`
    };

    await interaction.reply({
        embeds: [createSuccessEmbed(locale === 'es' ? 'Idioma Actualizado' : 'Language Updated', messages[locale])],
    });
}
