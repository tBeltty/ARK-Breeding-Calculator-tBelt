# User Preferences

- **NO MANUAL VERIFICATION**: The user handles all manual verification. Do not attempt to run steps that require human interaction in the browser or mock manual checks unless explicitly asked.
- **Error Handling**: Use `sessions` correctly in `useAppLogic`.
- **Repository Strategy**: GitHub (`tBeltty/ARK-Breeding-Calculator-tBelt`) is the Source of Truth. Ensure `origin` points to this fork. ALWAYS use `main` branch (not `master`). Use `--allow-unrelated-histories` if syncing for the first time.
- **Development Workflow (CRITICAL)**:
    - **Git Mediation**: GitHub is the mediator for all patches and updates. NEVER deploy to production without first committing changes. Updating production blindly without Git history is FORBIDDEN.
- **Security & Secret Management (MAXIMUM PRIORITY)**:
    - **ZERO SECRET LEAKAGE**: Before EVERY push or deployment, perform a mandatory scan for hardcoded credentials (API keys, tokens, passwords). 
    - **Prohibited**: Never hardcode secrets in source code, even in temporary test scripts (`test_*.js`, `debug_*.js`).
    - **Environment Variables**: All secrets MUST reside in `.env` files, which are excluded from Git.
    - **Remediation**: If a leak is detected, rotation is mandatory and must be documented immediately.
- **Deployment Protocol (AUTOMATED)**:
    - **Versioning (MANDATORY)**: Before every push to `main`, analyze if the changes warrant a version bump. Follow Semantic Versioning:
        - **Major**: Incompatible API changes.
        - **Minor**: New functionality in a backwards compatible manner.
        - **Patch**: Backwards compatible bug fixes (including data updates).
        - **Action**: Always update `package.json` and `discord-bot/package.json`. The API and Bot UI will sync automatically.
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
    - **Required Production `.env`** (`/var/www/ark.tbelt.online/bot/.env`):
        - `DISCORD_TOKEN` — Bot token from Discord Developer Portal.
        - `DISCORD_CLIENT_ID` — Application ID.
        - `NODE_ENV=production`
        - `API_PORT=3005`
        - `ARK_STATUS_API_KEY` — ArkStatus.com API key. **Without this, ALL server monitoring fails silently (401 on every API call).**
    - **Logging**: Use `pm2 logs ark-bot` to verify initialization and command registration.
    - **Post-Deploy Verification**: The CI/CD pipeline (`deploy.yml`) includes automated checks:
        1. Verifies all required env vars exist in production `.env` (fails the build if missing).
        2. Health-checks `localhost:3005/api/stats` to confirm the bot API responds and Discord is connected.
    - **Automated Maintenance (PM2)**:
        - **Daily restart**: Cron `0 5 * * *` (5 AM UTC / 12 AM EST) — clears memory leaks, refreshes Discord gateway connections.
        - **Memory guard**: Auto-restarts if memory exceeds 200MB (`--max-memory-restart 200M`).
        - Both settings are **persisted** via `pm2 save` — survives server reboots.
        - **Do not change** without also updating this documentation.



- **Repository Quirks & Incidents (READ BEFORE ACTING)**:
    - **Incident 2026-02-13 (Missing API Key)**: `ARK_STATUS_API_KEY` was never added to the production `.env`. The bot ran for 14 days with every ArkStatus API call returning 401, causing all servers to appear offline.
        - **Resolution**: Added the key to production `.env`, restarted PM2. Added automated env var verification to `deploy.yml`.
        - **Rule**: When adding a new env var to the codebase, it MUST also be added to the production `.env` on the VPS. The CI/CD will now fail the build if any required var is missing.
    - **Incident 2026-02-13 (Security Leak)**: API keys were hardcoded in temporary test scripts (`test_id_endpoint.js`, etc.).
        - **Resolution**: All test scripts were deleted. Global repository scan performed. Secret rotation initiated.
        - **Rule**: No test code containing real data may be committed. All local debugging MUST use environment variables.
    - **Incident 2026-01-24 (Submodules)**: `src_new` was a nested Git repository causing CI issues.
        - **Resolution**: Refactored to standard Monorepo structure (Flattened Source). `src_new` is DELETED. Source is now in `/src`.
        - **Rule**: Standard `src/` folder only. No nested submodules for core code.
    - **Incident 2026-01-24 (PM2 Cold Start)**: `pm2 restart` failed because the process didn't exist (first run or manual stop).
        - **Fix**: Updated usage to `pm2 restart <name> || pm2 start <file> --name <name>`.
        - **Rule**:### SHARED VPS SAFETY PROTOCOL
**CRITICAL: This VPS hosts multiple critical services (Finances, ARK, etc.)**

1. **PROACTIVE ISOLATION**: Before performing any system-level change (DNS, Nginx, Runner), identify ALL active virtual hosts (`ls /etc/nginx/sites-enabled`).
2. **THE "SECOND RULE"**: After *any* infrastructure restart, verify the health of ALL vhosts, not just the one currently being modified.
3. **DEPENDENCY MAPPING**: If a service (like finances-backend) relies on a database (PostgreSQL), ensure that database cluster is checked whenever the system is restarted.
4. **IMMEDIATE ROLLBACK**: If a change causes a 521 or 500 on a secondary site, prioritize its recovery above all other tasks.
5. **CI/CD IMMUTABILITY**: Manual file transfers (`scp`, manual `rsync`) for deployment are **STRICTLY FORBIDDEN**. All changes to production code or data MUST be pushed to the repository and deployed via the GitHub Actions runner to ensure state consistency and auditable history.
 Always use `restart || start` logic for process management.
