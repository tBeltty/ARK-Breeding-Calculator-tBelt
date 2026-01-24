# 🚨 Disaster Recovery & Backup Guide

This guide explains how to protect your application data and configuration against catastrophic failure (e.g., losing your VPS or local development machine).

## What is backed up?
The GitHub repository contains the application code, but it **deliberately excludes** sensitive information for security. The missing pieces (secrets) must be backed up separately.

**Excluded from Git (The "Secrets"):**
- 🔑 Environment Variables (`.env`, `.env.production.local`) - *Contains DB passwords, JWT secrets.*
- 🔑 SSH Deployment Keys (`deploy_key`, `deploy_key.pub`) - *Access to the server.*
- 📄 Internal Documentation (`docs/troubleshooting/`, `.agent/`) - *Context and logs.*
- ⚙️ Backup Scripts & Utils (`.secrets/`)

## 🛡️ How to Backup (Routine)

We have created a script to automate bundling these secrets.

1. **Run the Backup Script:**
   ```bash
   ./scripts/backup_secrets.sh
   ```
   This will create a file named `secrets_backup_YYYYMMDD_HHMMSS.zip` in the root directory.

2. **Store Off-Site (CRITICAL):**
   Immediately move this zip file to a secure, off-site location.
   - **Recommended:** 1Password / LastPass (Secure Note attachment)
   - **Alternative:** Encrypted USB Drive
   - **Alternative:** Private Google Drive / Dropbox (Ensure it requires 2FA to access)

   > ⚠️ **NEVER** leave the zip file on the server or commit it to Git.

## 🆘 How to Restore (Disaster Recovery)

If you lose your machine or VPS, follow these steps:

### Scenario A: New Local Machine
1. Clone the repository: `git clone <repo_url>`
2. Download your latest `secrets_backup_*.zip` from your secure storage.
3. Unzip it into the project root:
   ```bash
   unzip secrets_backup_*.zip
   ```
4. Run `npm install` and start working.

### Scenario B: New VPS / Server
1. Provision the new server.
2. Clone the repo on the server.
3. **Upload the secrets:**
   - SCP the zip file to the server:
     ```bash
     scp secrets_backup_*.zip user@your-vps-ip:/path/to/app/
     ```
   - OR manually create the `.env.production.local` file with the content from your backup.
4. Restore `deploy_key` if you use it for git access from the server.
5. Restore Database:
   - If you have a `postgres_data` dump (separate from this file backup), restore it using `psql`.
