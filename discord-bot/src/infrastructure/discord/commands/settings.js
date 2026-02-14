/**
 * /settings Command
 * 
 * View and configure server settings.
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { GuildRepository } from '../../database/repositories/GuildRepository.js';
import { createSuccessEmbed, createErrorEmbed, createInfoEmbed } from '../../../shared/embeds.js';
import { t, getLocale } from '../../../shared/i18n.js';

export const data = new SlashCommandBuilder()
    .setName('settings')
    .setNameLocalizations({ 'es-ES': 'config', 'es-419': 'config' })
    .setDescription('Configure bot settings for this server')
    .setDescriptionLocalizations({ 'es-ES': 'Configura el bot para este servidor', 'es-419': 'Configura el bot para este servidor' })
    .addSubcommand(subcommand =>
        subcommand
            .setName('view')
            .setNameLocalizations({ 'es-ES': 'ver', 'es-419': 'ver' })
            .setDescription('View current settings')
            .setDescriptionLocalizations({ 'es-ES': 'Muestra la configuración actual', 'es-419': 'Muestra la configuración actual' })
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('game')
            .setNameLocalizations({ 'es-ES': 'juego', 'es-419': 'juego' })
            .setDescription('Set game version (ASE or ASA)')
            .setDescriptionLocalizations({ 'es-ES': 'Cambia entre ASE y ASA', 'es-419': 'Cambia entre ASE y ASA' })
            .addStringOption(option =>
                option
                    .setName('version')
                    .setNameLocalizations({ 'es-ES': 'version', 'es-419': 'version' })
                    .setDescription('Game version')
                    .setDescriptionLocalizations({ 'es-ES': 'Versión del juego', 'es-419': 'Versión del juego' })
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
            .setNameLocalizations({ 'es-ES': 'rates', 'es-419': 'rates' })
            .setDescription('Set server maturation rates')
            .setDescriptionLocalizations({ 'es-ES': 'Configura el multiplicador de maduración', 'es-419': 'Configura el multiplicador de maduración' })
            .addStringOption(option =>
                option
                    .setName('mode')
                    .setNameLocalizations({ 'es-ES': 'modo', 'es-419': 'modo' })
                    .setDescription('Rate mode: Official or Custom')
                    .setDescriptionLocalizations({ 'es-ES': 'Modo: Oficial (auto) o Personalizado', 'es-419': 'Modo: Oficial (auto) o Personalizado' })
                    .setRequired(true)
                    .addChoices(
                        { name: 'Official (Auto-Sync)', value: 'official' },
                        { name: 'Custom (Manual)', value: 'custom' }
                    )
            )
            .addNumberOption(option =>
                option
                    .setName('multiplier')
                    .setNameLocalizations({ 'es-ES': 'multiplicador', 'es-419': 'multiplicador' })
                    .setDescription('Rate multiplier (Custom mode only)')
                    .setDescriptionLocalizations({ 'es-ES': 'Multiplicador (solo modo Personalizado)', 'es-419': 'Multiplicador (solo modo Personalizado)' })
                    .setRequired(false)
                    .setMinValue(0.1)
                    .setMaxValue(100)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('notify')
            .setNameLocalizations({ 'es-ES': 'alertas', 'es-419': 'alertas' })
            .setDescription('Configure notification preferences')
            .setDescriptionLocalizations({ 'es-ES': 'Elige cómo recibir avisos del bot', 'es-419': 'Elige cómo recibir avisos del bot' })
            .addStringOption(option =>
                option
                    .setName('mode')
                    .setNameLocalizations({ 'es-ES': 'modo', 'es-419': 'modo' })
                    .setDescription('Notification mode')
                    .setDescriptionLocalizations({ 'es-ES': 'Modo de avisos', 'es-419': 'Modo de avisos' })
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
            .setNameLocalizations({ 'es-ES': 'canal', 'es-419': 'canal' })
            .setDescription('Set notification channel')
            .setDescriptionLocalizations({ 'es-ES': 'Elige en qué canal avisa el bot', 'es-419': 'Elige en qué canal avisa el bot' })
            .addChannelOption(option =>
                option
                    .setName('target')
                    .setNameLocalizations({ 'es-ES': 'canal', 'es-419': 'canal' })
                    .setDescription('The channel for notifications')
                    .setDescriptionLocalizations({ 'es-ES': 'Canal donde enviar avisos', 'es-419': 'Canal donde enviar avisos' })
                    .setRequired(true)
            )
    )
    .addSubcommand(subcommand =>
        subcommand
            .setName('language')
            .setNameLocalizations({ 'es-ES': 'idioma', 'es-419': 'idioma' })
            .setDescription('Set bot language for this server')
            .setDescriptionLocalizations({ 'es-ES': 'Cambia el idioma del bot', 'es-419': 'Cambia el idioma del bot' })
            .addStringOption(option =>
                option
                    .setName('locale')
                    .setNameLocalizations({ 'es-ES': 'idioma', 'es-419': 'idioma' })
                    .setDescription('Language')
                    .setDescriptionLocalizations({ 'es-ES': 'Idioma', 'es-419': 'Idioma' })
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
        const locale = getLocale(interaction.guildId);
        return interaction.reply({ content: t(locale, 'common.no_permission'), ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const guild = GuildRepository.findOrCreate(interaction.guildId);
    const locale = getLocale(interaction.guildId);

    switch (subcommand) {
        case 'view':
            await handleView(interaction, guild, locale);
            break;
        case 'game':
            await handleGame(interaction, guild, locale);
            break;
        case 'rates':
            await handleRates(interaction, guild, locale);
            break;
        case 'notify':
            await handleNotify(interaction, guild, locale);
            break;
        case 'channel':
            await handleChannel(interaction, guild, locale);
            break;
        case 'language':
            await handleLanguage(interaction, guild, locale);
            break;
    }
}

async function handleView(interaction, guild, locale) {
    const embed = new EmbedBuilder()
        .setColor(0x6366F1)
        .setTitle(t(locale, 'settings.view_title'))
        .addFields(
            { name: t(locale, 'settings.game_version'), value: guild.game_version || 'ASA', inline: true },
            { name: t(locale, 'settings.server_rates'), value: `${guild.server_rates || 1}x`, inline: true },
            { name: t(locale, 'settings.notifications'), value: guild.notify_mode || 'channel', inline: true },
            { name: t(locale, 'settings.notify_channel'), value: guild.notify_channel_id ? `<#${guild.notify_channel_id}>` : t(locale, 'settings.not_set'), inline: true },
            { name: t(locale, 'settings.language'), value: guild.locale === 'es' ? 'Español' : 'English', inline: true },
            { name: t(locale, 'settings.alert_threshold'), value: `${guild.alert_threshold || 5} min`, inline: true },
            { name: t(locale, 'settings.tier'), value: (guild.premium_tier || 'free').toUpperCase(), inline: true },
        )
        .setFooter({ text: t(locale, 'settings.footer') })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

async function handleGame(interaction, guild, locale) {
    const version = interaction.options.getString('version');
    GuildRepository.updateSettings(interaction.guildId, { game_version: version });

    await interaction.reply({
        embeds: [createSuccessEmbed(t(locale, 'settings.game_updated_title'), t(locale, 'settings.game_updated_desc', { version }))],
    });
}

async function handleRates(interaction, guild, locale) {
    const mode = interaction.options.getString('mode');
    const multiplier = interaction.options.getNumber('multiplier');

    if (mode === 'custom' && !multiplier) {
        await interaction.reply({
            embeds: [createErrorEmbed(t(locale, 'settings.rates_error_title'), t(locale, 'settings.rates_error_desc'))],
            ephemeral: true
        });
        return;
    }

    const updates = { auto_rates: mode === 'official' ? 1 : 0 };
    if (mode === 'custom') updates.server_rates = multiplier;

    GuildRepository.updateSettings(interaction.guildId, updates);

    const message = mode === 'official'
        ? t(locale, 'settings.rates_official')
        : t(locale, 'settings.rates_custom', { multiplier });

    await interaction.reply({
        embeds: [createSuccessEmbed(t(locale, 'settings.rates_updated_title'), message)],
    });
}

async function handleNotify(interaction, guild, locale) {
    const mode = interaction.options.getString('mode');
    GuildRepository.updateSettings(interaction.guildId, { notify_mode: mode });

    const modeKeys = {
        channel: 'settings.notify_channel_mode',
        dm: 'settings.notify_dm_mode',
        off: 'settings.notify_off_mode',
    };

    await interaction.reply({
        embeds: [createSuccessEmbed(t(locale, 'settings.notify_updated_title'), `${t(locale, modeKeys[mode])}.`)],
    });
}

async function handleChannel(interaction, guild, locale) {
    const channel = interaction.options.getChannel('target');
    GuildRepository.updateSettings(interaction.guildId, { notify_channel_id: channel.id });

    await interaction.reply({
        embeds: [createSuccessEmbed(t(locale, 'settings.channel_updated_title'), t(locale, 'settings.channel_updated_desc', { channel }))],
    });
}

async function handleLanguage(interaction, guild, locale) {
    const newLocale = interaction.options.getString('locale');
    GuildRepository.updateSettings(interaction.guildId, { locale: newLocale });

    // Use the NEW locale for the confirmation message
    const title = newLocale === 'es' ? t('es', 'settings.language_updated_es') : t('en', 'settings.language_updated_en');
    const msg = newLocale === 'es' ? t('es', 'settings.language_set_es') : t('en', 'settings.language_set_en');

    await interaction.reply({
        embeds: [createSuccessEmbed(title, msg)],
    });
}
