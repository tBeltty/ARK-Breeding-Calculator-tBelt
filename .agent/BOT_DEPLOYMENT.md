# Discord Bot Deployment Manual

## 🌍 Server Details
- **IP:** `93.188.163.184`
- **User:** `root`
- **SSH Key:** `~/.ssh/id_rsa` (Requires passphrase `SSH_PASSPHRASE_PLACEHOLDER`)
- **Host Alias:** `mi-vps` (configured in `~/.ssh/config`)

## 📂 Directories & Paths
- **Front Path:** `/var/www/ark.tbelt.online/html`
- **Bot Path:** `/var/www/ark.tbelt.online/bot`
- **Database:** `/var/www/ark.tbelt.online/bot/data/bot.sqlite` (SQLite)
- **Logs:** `~/.pm2/logs/ark-bot-out.log` & `ark-bot-error.log`

## ⚙️ Process Management (PM2)
The bot is managed by PM2 under the name `ark-bot`.

| Property | Value | Note |
|----------|-------|------|
| **Name** | `ark-bot` | Version 3.0 |
| **Port** | `3005` | Must match Nginx Proxy Pass |
| **API** | `/api/*` | Proxied from `ark.tbelt.online` |


## 🚀 Deployment Workflow

> [!IMPORTANT]
> **PREVENT SERVER LOCKOUTS:** Always ensure your SSH key is loaded in your agent before deploying.
> Run `ssh-add ~/.ssh/id_rsa` (Passphrase: `SSH_PASSPHRASE_PLACEHOLDER`) if you haven't recently.
> The `deploy.sh` script will enforce this check for you.

### 1. Build and Deploy Frontend
```bash
cd src_new
npm run build
rsync -avz --delete ./dist/ mi-vps:/var/www/ark.tbelt.online/html/
```

### 2. Deploy Bot (Safe Method)
Run the automated script which checks for SSH keys first:
```bash
# From root directory
chmod +x discord-bot/scripts/deploy.sh
./discord-bot/scripts/deploy.sh
```


## ⚠️ Critical Warnings

### ⛔ Co-located Services
This VPS also hosts **finances.tbelt.online** (Port 3001).
- **DO NOT** use port `3001`.
- **DO NOT** touch processes named `finances-backend` or `finances-server`.
- **DO NOT** modify `/var/www/finances.tbelt.online`.

### 🛡️ SSH Access
The SSH key requires a passphrase. When automating or running commands, you may need to use the `send_command_input` tool to provide the passphrase (`SSH_PASSPHRASE_PLACEHOLDER`).
