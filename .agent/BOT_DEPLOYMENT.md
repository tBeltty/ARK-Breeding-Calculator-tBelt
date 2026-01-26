# Discord Bot Deployment Manual

## 🚀 Deployment Workflow (CI/CD)

> [!IMPORTANT]
> **GITHUB IS THE MEDIATOR:** Deployment is fully automated. NEVER deploy manually or via local scripts unless in an absolute emergency.
> The source of truth is the `main` branch of [tBeltty/ARK-Breeding-Calculator-tBelt](https://github.com/tBeltty/ARK-Breeding-Calculator-tBelt).

### 1. Primary Deployment Method
1. Ensure all tests pass (`npm run test`).
2. Commit your changes.
3. Push to `main` branch.
4. GitHub Actions (`.github/workflows/deploy.yml`) will automatically:
    - Build the Frontend.
    - Sync `dist/` to `/var/www/ark.tbelt.online/html/`.
    - Sync `discord-bot/` to `/var/www/ark.tbelt.online/bot/`.
    - Restart the bot process.

### 2. Manual Verification (SSH)
If the CI/CD fails, you can verify the status on the VPS (`mi-vps`):
- **Access:** `ssh root@93.188.163.184` (Key passphrase: `SSH_PASSPHRASE_PLACEHOLDER`)
- **Logs:** `pm2 logs ark-bot`
- **Status:** `pm2 status`

## ⚙️ Process Management (PM2)
Deployment scripts and manual restarts must be **idempotent**. 

> [!TIP]
> **Idempotency Rule:** Always use `pm2 restart <name> || pm2 start <file> --name <name>` to avoid errors if the process is not already running.

| Property | Value | Note |
|----------|-------|------|
| **Name** | `ark-bot` | Production Environment |
| **Port** | `3005` | Must match Nginx Proxy Pass |
| **API**  | `/api/*` | Proxied from `ark.tbelt.online` |

## 📂 Directories & Paths
- **Frontend Root:** `/var/www/ark.tbelt.online/html`
- **Bot Root:** `/var/www/ark.tbelt.online/bot`
- **Database:** `/var/www/ark.tbelt.online/bot/data/bot.sqlite` (SQLite)
- **Environment:** Bot requires `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, and `NODE_ENV=production`.

## ⚠️ Critical Infrastructure Warnings

### ⛔ Co-located Services
This VPS (`mi-vps`) also hosts **finances.tbelt.online** (Port 3001).
- **DO NOT** use port `3001`.
- **DO NOT** interfere with processes named `finances-backend` or `finances-server`.
- **DO NOT** modify `/var/www/finances.tbelt.online`.

### 🛡️ SSH Security
The SSH key requires a passphrase. While CI/CD handles deployment, manual cleanup requires `ssh-add ~/.ssh/id_rsa` or providing the passphrase `SSH_PASSPHRASE_PLACEHOLDER` when prompted.

---
*Last Updated: 2026-01-26 (Sync with CONTEXT.md)*
