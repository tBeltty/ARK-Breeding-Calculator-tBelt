# User Preferences

- **NO MANUAL VERIFICATION**: The user handles all manual verification. Do not attempt to run steps that require human interaction in the browser or mock manual checks unless explicitly asked.
- **Error Handling**: Use `sessions` correctly in `useAppLogic`.
- **Repository Strategy**: GitHub (`tBeltty/ARK-Breeding-Calculator-tBelt`) is the Source of Truth. Ensure `origin` points to this fork. ALWAYS use `main` branch (not `master`). Use `--allow-unrelated-histories` if syncing for the first time.
- **Deployment Protocol (STRICT)**:
    - **Verify Build**: ALWAYS run `npm run build` in `src_new` and verify Exit Code 0 before rsyncing.
    - **Frontend Path**: MUST sync `src_new/dist/` to `/var/www/ark.tbelt.online/html/`.
    - **Backend Path**: MUST sync `discord-bot/` to `/var/www/ark.tbelt.online/bot/` (exclude `node_modules`, `data`, `tests`).
    - **Production Sync**: 
        1. `rsync -avz --exclude 'node_modules' --exclude 'data' --exclude 'tests' ./discord-bot/ mi-vps:/var/www/ark.tbelt.online/bot/`
        2. SSH into VPS: `cd /var/www/ark.tbelt.online/bot && npm install --production`
        3. Clear Cache: `pm2 delete ark-bot` (if changing env) or `pm2 restart ark-bot --update-env`.
    - **Nginx Security**: Ensure `ark.tbelt.online/api/` points to `localhost:3005`.

- **Server Infrastructure (mi-vps)**:
    - **Port 3001**: Finances Backend (DO NOT INTERFERE).
    - **Port 3005**: Arktic Assistant API (Production).
    - **Environment**: Bot requires `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `NODE_ENV=production`.
    - **Logging**: Use `pm2 logs ark-bot` to verify initialization and command registration.


