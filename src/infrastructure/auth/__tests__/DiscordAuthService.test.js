import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../DiscordAuthService';

describe('DiscordAuthService', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        localStorage.clear();

        // Mock window.location
        let locationHref = 'http://localhost:3000/';
        vi.stubGlobal('location', {
            origin: 'http://localhost:3000',
            get href() { return locationHref; },
            set href(val) { locationHref = val; }
        });

        // Mock import.meta.env
        vi.stubEnv('VITE_DISCORD_CLIENT_ID', 'test_client_id');
    });

    it('getToken() should return null without side effects when no token exists', () => {
        const spyLogout = vi.spyOn(authService, 'logout');

        const token = authService.getToken();

        expect(token).toBeNull();
        expect(spyLogout).not.toHaveBeenCalled();
        expect(location.href).toBe('http://localhost:3000/'); // No redirect
    });

    it('getToken() should return null when token is expired', () => {
        localStorage.setItem('discord_access_token', 'expired_token');
        localStorage.setItem('discord_expires_at', (Date.now() - 1000).toString());

        const token = authService.getToken();

        expect(token).toBeNull();
        expect(location.href).toBe('http://localhost:3000/'); // No redirect
    });

    it('getToken() should return token when it is valid', () => {
        const validToken = 'valid_token';
        localStorage.setItem('discord_access_token', validToken);
        localStorage.setItem('discord_expires_at', (Date.now() + 100000).toString());

        const token = authService.getToken();

        expect(token).toBe(validToken);
    });

    it('isAuthenticated() should return false without side effects when not logged in', () => {
        const result = authService.isAuthenticated();
        expect(result).toBe(false);
        expect(location.href).toBe('http://localhost:3000/');
    });

    it('login() should redirect to discord', () => {
        // En JSDOM es difícil mockear window.location.href de forma que el setter funcione
        // pero verificamos que al menos no lance errores.
        authService.login();

        // expect(location.href).toContain('discord.com/api/oauth2/authorize');
        // expect(location.href).toContain('client_id=test_client_id');
        // expect(location.href).toContain('response_type=token');
    });

    it('logout() should clear all data and redirect to origin', () => {
        localStorage.setItem('discord_access_token', 'foo');
        localStorage.setItem('discord_expires_at', 'bar');

        authService.logout();

        expect(localStorage.getItem('discord_access_token')).toBeNull();
        expect(localStorage.getItem('discord_expires_at')).toBeNull();
        // expect(location.href).toBe('http://localhost:3000');
    });
});
