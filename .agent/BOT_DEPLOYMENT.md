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
| **Name** | `ark-bot` | Distinct from `finances-*` |
| **Port** | `3005` | Internal API for Dashboard |
| **Memory Limit** | `500M` | Auto-restart if exceeded |

## 🚀 Deployment Workflow

### 1. Build and Deploy Frontend
```bash
cd src_new && npm run build
rsync -avz --delete ./dist/ mi-vps:/var/www/ark.tbelt.online/html/
```

### 2. Update Bot
```bash
rsync -avz --delete --exclude 'node_modules' --exclude 'data' ./discord-bot/ mi-vps:/var/www/ark.tbelt.online/bot/
```

### 3. Restart Process
```bash
ssh mi-vps "pm2 restart ark-bot"
```

## ⚠️ Critical Warnings

### ⛔ Co-located Services
This VPS also hosts **finances.tbelt.online** (Port 3001).
- **DO NOT** use port `3001`.
- **DO NOT** touch processes named `finances-backend` or `finances-server`.
- **DO NOT** modify `/var/www/finances.tbelt.online`.

### 🛡️ SSH Access
The SSH key requires a passphrase. When automating or running commands, you may need to use the `send_command_input` tool to provide the passphrase (`SSH_PASSPHRASE_PLACEHOLDER`).
