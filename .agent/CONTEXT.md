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



- **Repository Quirks & Incidents (READ BEFORE ACTING)**:
    - **Incident 2026-01-24 (Submodules)**: `src_new` was a nested Git repository causing CI issues.
        - **Resolution**: Refactored to standard Monorepo structure (Flattened Source). `src_new` is DELETED. Source is now in `/src`.
        - **Rule**: Standard `src/` folder only. No nested submodules for core code.
    - **Incident 2026-01-24 (PM2 Cold Start)**: `pm2 restart` failed because the process didn't exist (first run or manual stop).
        - **Fix**: Updated usage to `pm2 restart <name> || pm2 start <file> --name <name>`.
        - **Rule**: Deployment scripts must be idempotent. Always use `restart || start` logic for process management.
