import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../infrastructure/auth/DiscordAuthService';
import { ServerSettingsEditor } from '../components/Dashboard/ServerSettingsEditor';
import { CommandManager } from '../components/Dashboard/CommandManager';
import { RemoteCommandRunner } from '../components/Dashboard/RemoteCommandRunner';
import { ServerStatusManager } from '../components/Dashboard/ServerStatusManager';
import styles from './DashboardPage.module.css';
import '../styles/tokens.css';
import '../styles/globals.css';
import { CollapsibleSection } from '../components/Dashboard/CollapsibleSection';
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [guilds, setGuilds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedGuild, setSelectedGuild] = useState(null);
    const [guildDetail, setGuildDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        console.log('Dashboard v2.7.7 loaded');
        const storedUser = localStorage.getItem('discord_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, [navigate]);

    const fetchGuilds = async () => {
        const token = authService.getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/guilds', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setGuilds(data.guilds || []);
            }
        } catch (error) {
            console.error('Failed to fetch guilds', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = authService.getToken();
        if (token) {
            fetchGuilds();
        } else {
            console.log('No valid token found, skipping guild fetch');
            setLoading(false);
        }
    }, []);

    const fetchGuildDetail = async (guildId) => {
        console.log('Fetching detail for:', guildId);
        setDetailLoading(true);
        const token = authService.getToken();
        try {
            const response = await fetch(`/api/guilds/${guildId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Received guild data:', data);
                setGuildDetail(data);
                const baseGuild = guilds.find(g => g.id === guildId) || { id: guildId, name: 'Unknown Server' };
                setSelectedGuild(baseGuild);
            } else {
                console.error('Failed to fetch guild detail. Status:', response.status);
                alert(`Error: Could not load server settings (Status ${response.status}). The bot might not be fully initialized in this server.`);
            }
        } catch (error) {
            console.error('Network error fetching guild detail', error);
            alert('Network error: Could not reach the bot API.');
        } finally {
            setDetailLoading(false);
        }
    };

    const handleUpdateSettings = async (updates) => {
        const token = authService.getToken();
        try {
            const response = await fetch(`/api/guilds/${selectedGuild.id}/settings`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });
            if (response.ok) {
                const resData = await response.json();
                setGuildDetail(prev => ({ ...prev, settings: resData.settings }));
            }
        } catch (e) {
            console.error('Failed to update settings', e);
        }
    };

    const handleStopCreature = async (creatureId) => {
        // Implement stop creature API call if needed, or just refresh detail
        // For now, let's assume we need a new endpoint PATCH /api/creatures/:id/stop
        const token = authService.getToken();
        try {
            await fetch(`/api/guilds/${selectedGuild.id}/creatures/${creatureId}/stop`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchGuildDetail(selectedGuild.id);
        } catch (e) { console.error(e); }
    };

    const handleRemoteTrack = async (data) => {
        const token = authService.getToken();
        try {
            const response = await fetch(`/api/guilds/${selectedGuild.id}/commands/track`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                const resData = await response.json();
                if (resData.warning) {
                    alert(`⚠️ ${resData.warning}`);
                }
                fetchGuildDetail(selectedGuild.id); // Refresh to show new creature
            } else {
                const err = await response.json();
                alert(`Failed to start tracker: ${err.error || 'Unknown error'}`);
            }
        } catch (e) {
            console.error(e);
            alert('Network error executing command.');
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/');
    };

    if (loading) return <div className={styles.container} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t('ui.loading')}</div>;

    if (!authService.isAuthenticated()) {
        return (
            <div className={styles.loginContainer}>
                <div className={styles.loginCard}>
                    <img src="/logo.png" alt="Logo" className={styles.logo} style={{ marginBottom: '24px' }} />
                    <h2 className={styles.loginTitle}>Access Dashboard</h2>
                    <p className={styles.loginText}>Please login with Discord to manage your bot servers.</p>
                    <button onClick={() => authService.login()} className={`${styles.actionBtn} ${styles.primaryBtn}`}>
                        Login with Discord
                    </button>
                    <button onClick={() => navigate('/')} className={styles.navLink} style={{ marginTop: '16px' }}>
                        Back to Calculator
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.brand}>
                    <img src="/logo.png" alt="Logo" className={styles.logo} />
                    <h1 className={styles.title}>{t('panels.bot_dashboard')}</h1>
                </div>
                <div className={styles.userControls}>
                    <button onClick={() => navigate('/')} className={styles.navLink}>{t('ui.calculator_btn')}</button>
                    {user && (
                        <div className={styles.userInfo}>
                            <img src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`} className={styles.userAvatar} alt="User" />
                            <span>{user.username}</span>
                        </div>
                    )}
                    <button onClick={handleLogout} className={styles.logoutBtn}>{t('ui.logout')}</button>
                </div>
            </header>

            <main>
                {selectedGuild && guildDetail ? (
                    <div className={styles.managementView}>
                        <div className={styles.headerLine}>
                            <button onClick={() => { setSelectedGuild(null); setGuildDetail(null); }} className={styles.backBtn}>
                                &larr; {t('ui.back_servers')}
                            </button>
                            <div className={styles.guildTitle}>
                                <img src={`https://cdn.discordapp.com/icons/${selectedGuild.id}/${selectedGuild.icon}.png`} className={styles.smallIcon} alt="" />
                                <h2>{selectedGuild.name} {guildDetail.isAdmin ? t('ui.admin') : t('ui.member')}</h2>
                            </div>
                        </div>

                        <div className={styles.editorFlex}>
                            {guildDetail.isAdmin && (
                                <>
                                    <CollapsibleSection title={t('panels.server_settings')} icon="⚙️" defaultOpen={false}>
                                        <ServerSettingsEditor
                                            settings={guildDetail.settings}
                                            channels={guildDetail.channels}
                                            onSave={handleUpdateSettings}
                                        />
                                    </CollapsibleSection>

                                    <CollapsibleSection title={t('panels.command_restrictions')} icon="🔒">
                                        <CommandManager
                                            channels={guildDetail.channels}
                                            roles={guildDetail.roles || []}
                                            restrictions={guildDetail.settings.command_restrictions}
                                            onSave={(json) => handleUpdateSettings({ command_restrictions: json })}
                                        />
                                    </CollapsibleSection>

                                    <CollapsibleSection title={t('panels.server_tracking')} icon="🛰️" defaultOpen={true}>
                                        <ServerStatusManager
                                            guildId={selectedGuild.id}
                                            channels={guildDetail.channels}
                                            globalSettings={guildDetail.settings}
                                        />
                                    </CollapsibleSection>
                                </>
                            )}

                            <CollapsibleSection title={t('panels.remote_runner')} icon="⚡" defaultOpen={!guildDetail.isAdmin}>
                                <RemoteCommandRunner
                                    channels={guildDetail.channels}
                                    onExecute={handleRemoteTrack}
                                />
                            </CollapsibleSection>
                        </div>

                        <CollapsibleSection title={guildDetail.isAdmin ? t('panels.all_trackers') : t('panels.my_trackers')} icon="🦕" defaultOpen={true}>
                            <div className={styles.trackerGrid}>
                                {guildDetail.creatures.map(c => (
                                    <div key={c.id} className={styles.trackerCard}>
                                        <div className={styles.trackerInfo}>
                                            <strong>{c.nickname || c.creature_type}</strong>
                                            <span>{c.creature_type} {guildDetail.isAdmin && c.user_id !== user?.id && `(Owner ID: ${c.user_id})`}</span>
                                        </div>
                                        <button onClick={() => handleStopCreature(c.id)} className={styles.stopBtn}>{t('ui.stop')}</button>
                                    </div>
                                ))}
                                {guildDetail.creatures.length === 0 && (
                                    <p className={styles.emptyText}>
                                        {guildDetail.isAdmin
                                            ? t('messages.no_trackers')
                                            : t('messages.no_trackers')}
                                    </p>
                                )}
                            </div>
                        </CollapsibleSection>
                    </div>
                ) : (
                    <>
                        <h2 className={styles.sectionTitle}>{t('ui.select_server')}</h2>
                        <div className={styles.grid}>
                            {guilds.map(guild => (
                                <div key={guild.id} className={styles.card}>
                                    {guild.icon ? (
                                        <img src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`} alt={guild.name} className={styles.guildIcon} />
                                    ) : (
                                        <div className={styles.guildPlaceholder}>{guild.name.substring(0, 1)}</div>
                                    )}
                                    <h3 className={styles.guildName} title={guild.name}>{guild.name}</h3>
                                    {guild.in_server ? (
                                        <button
                                            onClick={() => {
                                                console.log('Managing bot for guild:', guild.id);
                                                fetchGuildDetail(guild.id);
                                            }}
                                            className={`${styles.actionBtn} ${styles.primaryBtn}`}
                                            disabled={detailLoading}
                                        >
                                            {detailLoading ? t('ui.loading') : t('ui.manage_bot')}
                                        </button>
                                    ) : (
                                        <a
                                            href={`https://discord.com/api/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&permissions=8&scope=bot%20applications.commands&guild_id=${guild.id}`}
                                            target="_blank" rel="noopener noreferrer" className={`${styles.actionBtn} ${styles.outlineBtn}`}
                                        >
                                            {t('ui.invite_bot')}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                        {guilds.length === 0 && !loading && (
                            <div className={styles.emptyState}>{t('messages.no_perms')}</div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
