# User Preferences

- **NO MANUAL VERIFICATION**: The user handles all manual verification. Do not attempt to run steps that require human interaction in the browser or mock manual checks unless explicitly asked.
- **Error Handling**: Use `sessions` correctly in `useAppLogic`.
- **Repository Strategy**: GitHub (`tBeltty/ARK-Breeding-Calculator-tBelt`) is the Source of Truth. Ensure `origin` points to this fork. ALWAYS use `main` branch (not `master`). Use `--allow-unrelated-histories` if syncing for the first time.
- **Development Workflow (CRITICAL)**:
    - **Git Mediation**: GitHub is the mediator for all patches and updates. NEVER deploy to production without first committing changes. Updating production blindly without Git history is FORBIDDEN.
- **Deployment Protocol (AUTOMATED)**:
    - **CI/CD**: Deployment is handled by the self-hosted GitHub Actions runner defined in `.github/workflows/deploy.yml`.
    - **Trigger**: Push to `main` branch.
    - **Actions**:
        1. Builds Frontend (`npm run build`) -> Syncs `dist/` to `/var/www/ark.tbelt.online/html/`.
        2. Syncs Bot (`./discord-bot/`) to `/var/www/ark.tbelt.online/bot/`.
        3. Restarts Bot (`pm2 restart ark-bot`).
    - **Manual Steps Forbidden**: Do not use local scripts or SSH to deploy manually.

- **Server Infrastructure (mi-vps)**:
    - **Port 3001**: Finances Backend (DO NOT INTERFERE).
    - **Port 3005**: Arktic Assistant API (Production).
    - **Environment**: Bot requires `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `NODE_ENV=production`.
    - **Logging**: Use `pm2 logs ark-bot` to verify initialization and command registration.


