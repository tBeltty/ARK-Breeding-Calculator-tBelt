# User Preferences

- **NO MANUAL VERIFICATION**: The user handles all manual verification. Do not attempt to run steps that require human interaction in the browser or mock manual checks unless explicitly asked.
- **Error Handling**: Use `sessions` correctly in `useAppLogic`.
- **Repository Strategy**: GitHub (`tBeltty/ARK-Breeding-Calculator-tBelt`) is the Source of Truth. Ensure `origin` points to this fork. ALWAYS use `main` branch (not `master`). Use `--allow-unrelated-histories` if syncing for the first time.
- **Deployment Protocol (STRICT)**:
    - **Verify Build**: ALWAYS wait for `npm run build` to finish and verify Exit Code 0 before rsyncing. Deployment of a broken `dist` folder is a CRITICAL failure.
    - **Frontend Path**: MUST sync to `/var/www/ark.tbelt.online/html/`.
    - **Backend Path**: MUST sync to `/var/www/ark.tbelt.online/bot/`.
    - **Post-Deploy Backend**: After every bot update, SSH into VPS and run `npm install --production` in `/bot` folder, then `pm2 restart ark-bot`.
    - **Safety**: Never run rsync against `/var/www/ark.tbelt.online/` root directly as it wipes necessary subdirectories.
- **Purity Rules**: Never use `Date.now()` directly in the render phase of components; use a `now` state updated by a timer. This prevents build-breaking lint errors.
- **Environment**: Bot requires `axios` and `dotenv`. Ensure `.env` is present on VPS (manual check).

- **Server Infrastructure (mi-vps)**:
    - **Port 3001**: Finances Backend (DO NOT USE).
    - **Port 3005**: ARK Bot API (Must match Nginx `proxy_pass`).
    - **Nginx**: Requests to `ark.tbelt.online/api/` are proxied to `localhost:3005`.

