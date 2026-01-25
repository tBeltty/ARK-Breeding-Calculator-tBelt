#!/bin/bash

# Safe Deployment Script
# Prevents server lockouts by verifying SSH agent contains keys before connecting.

# 1. Check if SSH Agent has identities
if ! ssh-add -l > /dev/null; then
    echo "❌ ERROR: No SSH identities found in agent."
    echo "⚠️  Running commands without a loaded key triggers interactive password prompts, which can lead to Fail2Ban IP lockouts."
    echo ""
    echo "👉 Please run this command first:"
    echo "   ssh-add ~/.ssh/id_rsa"
    exit 1
fi

echo "✅ SSH Key detected. Proceeding with deployment..."

# 2. Sync Files (Exclude heavy/unnecessary folders)
echo "📂 Syncing files to VPS..."
rsync -avz --exclude 'node_modules' --exclude 'data' --exclude 'tests' ./discord-bot/ mi-vps:/var/www/ark.tbelt.online/bot/

if [ $? -ne 0 ]; then
    echo "❌ Rsync failed."
    exit 1
fi

# 3. Restart Bot
echo "🚀 Restarting Bot on VPS..."
ssh mi-vps "cd /var/www/ark.tbelt.online/bot && pm2 restart ark-bot --update-env"

# 4. Deploy Frontend
echo "🎨 Building Frontend..."
npm run build

echo "📂 Syncing Frontend to VPS..."
rsync -avz --delete ./dist/ mi-vps:/var/www/ark.tbelt.online/html/

echo "✅ All Systems Deployed!"
