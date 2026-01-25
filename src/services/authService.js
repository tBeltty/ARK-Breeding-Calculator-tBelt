/**
 * Auth Service
 * Handles Discord OAuth2 Login
 */

const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID;

// Determinar REDIRECT_URI dinámicamente
const getRedirectUri = () => {
    return `${window.location.origin}/auth/callback`;
};

export const authService = {
    login: () => {
        if (!CLIENT_ID) {
            console.error('VITE_DISCORD_CLIENT_ID not set');
            return;
        }

        const redirectUri = getRedirectUri();
        // Scope: identify (user data), guilds (list of server to match admin rights)
        const scope = 'identify guilds';

        const url = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`;

        window.location.href = url;
    },

    logout: () => {
        localStorage.removeItem('discord_access_token');
        localStorage.removeItem('discord_token_type');
        localStorage.removeItem('discord_expires_in');
        localStorage.removeItem('discord_user');
        window.location.href = '/';
    },

    handleCallback: () => {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);

        const accessToken = params.get('access_token');
        const tokenType = params.get('token_type');
        const expiresIn = params.get('expires_in');

        if (accessToken) {
            localStorage.setItem('discord_access_token', accessToken);
            localStorage.setItem('discord_token_type', tokenType);
            // Calculate expiry timestamp
            const expiresAt = Date.now() + (parseInt(expiresIn) * 1000);
            localStorage.setItem('discord_expires_at', expiresAt);
            return true;
        }
        return false;
    },

    getToken: () => {
        const expiresAt = localStorage.getItem('discord_expires_at');
        if (!expiresAt || Date.now() > parseInt(expiresAt)) {
            authService.logout(); // Token expired
            return null;
        }
        return localStorage.getItem('discord_access_token');
    },

    isAuthenticated: () => {
        return !!authService.getToken();
    },

    // Fetch user profile from Discord
    getUserProfile: async () => {
        const token = authService.getToken();
        if (!token) return null;

        try {
            const response = await fetch('https://discord.com/api/users/@me', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.ok) {
                const user = await response.json();
                localStorage.setItem('discord_user', JSON.stringify(user));
                return user;
            } else {
                authService.logout();
                return null;
            }
        } catch (error) {
            console.error('Failed to fetch user profile', error);
            return null;
        }
    }
};
